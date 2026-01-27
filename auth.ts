/**
 * NOTE:
 *
 * Propósito
 * -------
 * Este archivo configura y exporta la capa de autenticación basada en
 * NextAuth para la aplicación. Centraliza:
 * - Proveedores (Credentials, Google, Facebook) y su activación condicional
 *   mediante variables de entorno.
 * - La normalización de la respuesta del backend (`normalizeUser`) para
 *   obtener un objeto de usuario consistente en todos los flujos.
 * - Callbacks clave de NextAuth: `signIn`, `jwt` y `session` para adaptar
 *   el intercambio con el backend (login, token exchange y exposición en la sesión).
 *
 * Flujo general
 * ------------
 * 1. Credentials (email/password):
 *    - Tiene 2 formas de autenticación:
 *      a) Si el usuario provee email y password en el formulario de login,
 *         se usa ese par para autenticar.
 *      b) Active Directory / LDAP: la API tiene desarrollo realizado para realizar autenticación con AD.
 *    - `authorize()` envía credenciales al endpoint del backend (/users/login).
 *    - Normaliza la respuesta con `normalizeUser`.
 *    - Si la API responde OK y devuelve usuario con `id`, el usuario se
 *      considera autenticado y NextAuth continuará el flujo.
 *
 * 2. OAuth (Google/Facebook):
 *    - Si las credenciales del proveedor están configuradas, el provider
 *      se habilita. En `signIn()` se realiza un intercambio adicional:
 *      la app envía tokens/claim al endpoint `/users/login/oauth` para que
 *      el backend valide el proveedor y devuelva o vincule un usuario.
 *    - La respuesta del backend se guarda temporalmente en `user._backend`
 *      para procesarla luego en `jwt()`.
 *
 * Normalización y contractos
 * -------------------------
 * - `normalizeUser(data)` intenta extraer un objeto usuario desde varias
 *   formas posibles (`user`, `usuario`, `data`, o plano). Devuelve:
 *   { id, name, email, role, accessToken, refreshToken } (o null si no hay usuario).
 * - Este contrato permite que la app trabaje con distintas formas JSON
 *   que el backend pueda devolver sin romper el resto de la lógica.
 *
 * Callbacks principales
 * ---------------------
 * - signIn({ account, profile, user }):
 *   - Para OAuth realiza el intercambio con `/users/login/oauth`.
 *   - Si el intercambio falla (res.ok === false) retorna false para bloquear
 *     el inicio de sesión.
 *   - Almacena la respuesta en `user._backend` para un procesamiento posterior.
 *
 * - jwt({ token, user, account }):
 *   - Para Credentials: toma el `user` normalizado (authorize) y copia
 *     campos relevantes (id, role, accessToken, refreshToken, email, name)
 *     dentro del token JWT.
 *   - Para OAuth: si `user._backend` existe, normaliza esa respuesta y
 *     prioriza los datos normalizados para poblar el token.
 *   - IMPORTANTE: aquí es donde se decide qué información viaja en el JWT.
 *     Evitar colocar secretos o datos sensibles en el token.
 *
 * - session({ session, token }):
 *   - Expone en `session.user` solo lo necesario (id, role) y añade
 *     `session.accessToken` si está disponible en el token.
 *   - La sesión es la vista pública/cliente del estado del usuario, no
 *     incluya más datos de los estrictamente necesarios.
 *
 * Variables de entorno requerida / opcionales
 * -----------------------------------------
 * - NEXT_PUBLIC_API_BASE (REQUIRED): URL base del backend para los endpoints
 *   de login y oauth.
 * - GOOGLE_ID / GOOGLE_SECRET: habilitan Google OAuth si están presentes.
 * - FACEBOOK_CLIENT_ID / FACEBOOK_CLIENT_SECRET: habilitan Facebook OAuth.
 *
 * Seguridad y recomendaciones
 * --------------------------
 * - Nunca almacenes tokens sensibles en la sesión del cliente sin cifrado.
 * - Limita lo que se guarda en el JWT: id, role y un token de acceso de corta
 *   vida son aceptables; evita datos personales extensos.
 * - Considera usar refresh tokens en el servidor y mantenerlos fuera del JWT
 *   si el backend lo soporta.
 * - Manejo de errores: los `console.log` actuales son útiles en desarrollo,
 *   pero deben reducirse o eliminarse en producción para evitar fugas.
 *
 * Extensiones y puntos de integración
 * -----------------------------------
 * - Añadir middleware de login (rate limiting, captcha) en el backend o
 *   envolver `authorize()` para proteger contra brute-force.
 * - Si se requiere SSO con más proveedores, agregar la lógica de intercambio
 *   análoga en `signIn()` y normalizar la respuesta.
 * - Para auditoría, considerar almacenar eventos importantes (login success/fail)
 *   en logs estructurados del backend.
 *
 * Testing y mantenimiento
 * -----------------------
 * - Es recomendable agregar tests unitarios para:
 *   - `normalizeUser` cubriendo todas las formas posibles de payload.
 *   - `authorize()` simulando respuestas 200 y errores del backend.
 * - Para cambios en la forma de la API del backend, actualizar primero
 *   `normalizeUser` y añadir tests que validen el mapping.
 *
 * WIP: traer todos los datos del usuarioDTO porque solo se están trayendo algunos datos
 *
 */
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";

console.log("NEXTAUTH_URL:", process.env.NEXTAUTH_URL);
console.log(
  "NEXTAUTH_SECRET:",
  process.env.NEXTAUTH_SECRET ? "✅ Definido" : "❌ No definido"
);
console.log("NEXT_PUBLIC_API_BASE:", process.env.NEXT_PUBLIC_API_BASE);
console.log("API_BASE_INTERNAL:", process.env.API_BASE_INTERNAL);
console.log("NODE_ENV:", process.env.NODE_ENV);

const API_BASE = process.env.API_BASE_INTERNAL || process.env.NEXT_PUBLIC_API_BASE!;
console.log(">>> Usando API_BASE:", API_BASE);

/** Normaliza distintas formas de respuesta del backend */
function normalizeUser(data: any) {
  // puede venir como { user }, { usuario }, { data } o plano
  const u = data?.user ?? data?.usuario ?? data?.data ?? data;
  if (!u) return null;

  const idCandidate =
    u.id ??
    u.idUsuario ??
    u.id_usuario ??
    u.userId ??
    u.username ??
    u.correo ??
    u.email;

  const id = idCandidate != null ? String(idCandidate) : undefined;

  const role =
    u.perfil?.nombre ?? u.role ?? u.nombrePerfil ?? u.nombre_perfil ?? null;

  const name =
    (u.nombre ?? u.name ?? [u.nombre, u.apellido].filter(Boolean).join(" ")) ||
    u.correo ||
    u.email;

  const accessToken = data?.token ?? data?.accessToken ?? u?.token ?? null;

  const extra = {
    idUsuario: u.idUsuario ?? (id ? Number(id) : null),
    nombre: u.nombre ?? null,
    apellido: u.apellido ?? null,
    nombrePerfil: u.nombrePerfil ?? role,
    tipoDocumento: u.tipoDocumento ?? null,
    documento: u.documento ?? null,
    direccion: {
      calle: u.calle ?? null,
      nroPuerta: u.nroPuerta ?? null,
      nroApto: u.nroApto ?? null,
    },
    fechaNacimiento: u.fechaNacimiento ?? null,
    estadoDescripcion: u.estadoDescripcion ?? null,
    telefonos: Array.isArray(u.telefonos)
      ? u.telefonos
      : u.telefonos
      ? [u.telefonos]
      : [],
  };

  return {
    id,
    name,
    email: u.correo ?? u.email ?? u.username ?? null,
    role,
    accessToken,
    refreshToken: data?.refreshToken ?? null,
    extra,
  };
}

// Helpers para activar OAuth sólo si hay credenciales
const maybeGoogle =
  process.env.GOOGLE_ID && process.env.GOOGLE_SECRET
    ? [
        Google({
          clientId: process.env.GOOGLE_ID!,
          clientSecret: process.env.GOOGLE_SECRET!,
        }),
      ]
    : [];

const maybeFacebook =
  process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET
    ? [
        Facebook({
          clientId: process.env.FACEBOOK_CLIENT_ID!,
          clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
        }),
      ]
    : [];

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },

  providers: [
    ...maybeGoogle,
    ...maybeFacebook,

    // --- Credentials (email + password) ---
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // API valida 'username' no 'email'
        const payload = {
          username: credentials?.email,
          password: credentials?.password,
        };

        console.log(">>> authorize payload", payload);

        const resp = await fetch(`${API_BASE}/users/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const text = await resp.clone().text();
        console.log(">>> /users/login status", resp.status, "body:", text);

        //CAPTURA DE ERRORES DEL BACKEND
        if (!resp.ok) {
          let errorMessage = "Credenciales incorrectas";

          try {
            const errorData = JSON.parse(text || "{}");
            errorMessage = errorData?.message || errorMessage;
            console.log(">>> Error del backend:", errorMessage);
          } catch (e) {
            console.log(">>> Error parseando:", e);
          }

          //NextAuth convierte esto en CredentialsSignin
          const error: any = new Error(errorMessage);
          error.type = "CredentialsSignin";
          error.message = errorMessage;
          throw error;
        }

        let data: any = {};
        try {
          data = JSON.parse(text || "{}");
        } catch (e) {
          console.log(">>> JSON parse error:", e);
          throw new Error("Error al procesar la respuesta del servidor");
        }

        const user = normalizeUser(data);
        console.log(">>> normalized user", user);

        if (!user?.id) {
          throw new Error("No se pudo obtener información del usuario");
        }

        return user;
      },
    }),
  ],

  callbacks: {
    // a) Bloquea o permite el login OAuth
    async signIn({ account, profile, user }) {
      if (account && (account.type === "oauth" || account.type === "oidc")) {
        const payload = {
          provider: account.provider,
          idToken: (account as any).id_token,
          accessToken: (account as any).access_token,
          email: (profile as any)?.email,
        };
        if (account.provider === "google" && (account as any).id_token) {
          payload.idToken = (account as any).id_token;
        }
        if (account.provider === "facebook" && (account as any).access_token) {
          payload.accessToken = (account as any).access_token;
        }

        const resp = await fetch(`${API_BASE}/users/login/oauth`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const text = await resp.text();
        console.log(">>> signIn oauth exchange", resp.status, text);

        if (!resp.ok) return false;
        try {
          (user as any)._backend = JSON.parse(text || "{}");
        } catch {}
      }
      return true;
    },

    // b) Construye el JWT
    async jwt({ token, user, account, trigger }) {
      console.log("🔐 JWT callback ejecutado");
      console.log("🔐 Trigger:", trigger);
      console.log("🔐 Token existente:", token ? "Sí" : "No");

      if (trigger === "update") {
        console.log(">>> JWT trigger: update - Revalidando sesión");

        try {
          const response = await fetch(`${API_BASE}/users/me`, {
            headers: {
              Authorization: `Bearer ${token.accessToken}`,
            },
          });

          if (response.ok) {
            const userData = await response.json();
            const normalized = normalizeUser(userData);

            if (normalized) {
              token.userData = normalized;
              console.log(">>> JWT updated with fresh user data");
            }
          }
        } catch (error) {
          console.error(">>> Error updating JWT with fresh data:", error);
        }
      }

      // Credentials: ya traés user normalizado en authorize()
      if (user && !(user as any)._backend) {
        token.id = (user as any).id;
        token.role = (user as any).role;
        (token as any).accessToken = (user as any).accessToken;
        (token as any).refreshToken = (user as any).refreshToken;
        token.email = (user as any).email ?? token.email;
        token.name = (user as any).name ?? token.name;

        (token as any).userData = user; 
        console.log(">>> jwt - userData guardado:", (token as any).userData);
      }

      // OAuth/OIDC aceptado por la API: normalizamos lo que guardamos en signIn()
      if (user && (user as any)._backend) {
        const normalized = normalizeUser((user as any)._backend) ?? {};
        token.id = (normalized as any).id ?? token.id;
        token.email = (normalized as any).email ?? token.email;
        token.name = (normalized as any).name ?? token.name;
        token.role = (normalized as any).role ?? token.role;
        (token as any).accessToken =
          (normalized as any).accessToken ?? (token as any).accessToken;
        (token as any).userData = normalized;
      }

      console.log(">>> jwt keys", Object.keys(token));
      return token;
    },

    // c) Expone lo necesario en la sesión
    async session({ session, token }) {
      session.user = session.user || ({} as any);
      (session.user as any).id = (token as any).id;
      (session.user as any).role = (token as any).role;
      (session as any).accessToken = (token as any).accessToken;

      (session as any).userData = (token as any).userData;
      console.log(
        ">>> session user.id",
        (session.user as any).id,
        "role",
        (session.user as any).role
      );
      return session;
    },
  },

  debug: process.env.NODE_ENV !== "production",
});