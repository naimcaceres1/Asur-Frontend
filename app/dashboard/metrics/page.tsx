// import React from "react";

// export default function MetricsPage() {
//   return (
//     <div className="w-full h-screen flex justify-center items-center p-4">
//       <iframe
//         src="https://lookerstudio.google.com/reporting/f43a6867-e286-43af-84a2-a940f7cd7ba3"
//         style={{ border: 0 }}
//         width="100%"
//         height="100%"
//         allowFullScreen
//       ></iframe>
//     </div>
//   );
// }
/*
import React from "react";

export default function MetricsPage() {
  // Reemplaza esta URL con la que copiaste en el paso 1 (Embed URL)
  const embedUrl =
    "https://lookerstudio.google.com/embed/reporting/f43a6867-e286-43af-84a2-a940f7cd7ba3/page/yISgF";

  return (
    <div className="w-full h-[calc(100vh-4rem)] flex flex-col p-4 gap-4">
      <h1 className="text-2xl font-bold">Métricas y Reportes</h1>

      <div className="w-full flex-1 bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 relative">
        <iframe
          src={embedUrl}
          style={{
            border: 0,
            width: "100%",
            height: "100%",
            position: "absolute",
            top: 0,
            left: 0,
          }}
          allowFullScreen
          sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        ></iframe>
      </div>
    </div>
  );
}
*/
/*
<iframe width="600" height="472" src="https://lookerstudio.google.com/embed/reporting/f43a6867-e286-43af-84a2-a940f7cd7ba3/page/yISgF" frameborder="0" style="border:0" allowfullscreen sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"></iframe>
*/


import React from "react";

export default function MetricsPage() {
  // URL de embed proporcionada
  const embedUrl = "https://lookerstudio.google.com/embed/reporting/f43a6867-e286-43af-84a2-a940f7cd7ba3/page/yISgF";

  return (
    <div className="w-full h-[calc(100vh-4rem)] flex flex-col p-4 gap-4">
      <h1 className="text-2xl font-bold">Métricas y Reportes</h1>
      
      <div className="w-full flex-1 bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 relative">
        <iframe
          src={embedUrl}
          style={{ 
            border: 0, 
            width: "100%", 
            height: "100%", 
            position: "absolute", 
            top: 0, 
            left: 0 
          }}
          // Propiedades estándar
          width="100%"
          height="100%"
          allowFullScreen
          frameBorder="0" // React usa camelCase para atributos HTML
          // Propiedades de seguridad específicas de Looker Studio
          sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        ></iframe>
      </div>
    </div>
  );
}