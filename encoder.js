/* ============================================================
   📦 ENCODER — ELMA-Suite
   Ofuscación Base64 + sustitución + XOR
   Produce un archivo users.enc totalmente compatible
   con el decoder restaurado.
   ============================================================ */

(function () {

  /* ========= 💠 CONFIGURACIÓN (misma que el decoder) 💠 ========= */

  // Tabla de sustitución original (inversa a decoder.js)
  const MAP = {
    "A": "!", "E": "@", "I": "#", "O": "$", "U": "%",
    "a": "^", "e": "&", "i": "*", "o": "(", "u": ")"
  };

  function applyMap(str) {
    return str.replace(/[AEIOUaeiou]/g, m => MAP[m] || m);
  }

  // XOR simple con la misma clave fija
  const KEY = 147;

  function xorEncode(bytes) {
    const out = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) {
      out[i] = bytes[i] ^ KEY;
    }
    return out;
  }

  /* ============================================================
     🔐 Función principal: toma JSON → produce users.enc
     ============================================================ */

  async function encodeUsers(users) {
    if (!Array.isArray(users))
      throw new Error("La lista debe ser un arreglo de objetos {code,name}");

    // Convertir JSON a texto
    const json = JSON.stringify(users);

    // Convertir a bytes
    const encoder = new TextEncoder();
    const bytes = encoder.encode(json);

        // XOR
    const xored = xorEncode(bytes);

    // Base64
    let bin = "";
    for (let i = 0; i < xored.length; i++) {
      bin += String.fromCharCode(xored[i]);
    }
    let base64 = btoa(bin);

    // aplicar sustitución (misma que en users.enc actual)
    base64 = applyMap(base64);

    return base64;
  }

  /* ============================================================
     💾 Descarga del archivo users.enc
     ============================================================ */

  function downloadUsersEnc(encodedText) {
    const blob = new Blob([encodedText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "users.enc";
    a.click();

    URL.revokeObjectURL(url);
  }

  /* ============================================================
     🌟 API global: window.encoder
     ============================================================ */

  window.encoder = {
    encodeUsers,
    downloadUsersEnc
  };

})();
