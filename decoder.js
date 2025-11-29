/* ============================================================
   📦 DECODER ORIGINAL — Restaurado para ELMA-Suite
   Ofuscación Base64 + sustitución + rotaciones XOR
   Expone window.decoder.loadUsers()
   ============================================================ */

window.decoder = (function () {

  /* ========= 💠 ALGORITMO ORIGINAL RECONSTRUIDO 💠 ========= */

  // Tabla de sustitución original
  const MAP = {
    "!": "A", "@": "E", "#": "I", "$": "O", "%": "U",
    "^": "a", "&": "e", "*": "i", "(": "o", ")": "u"
  };

  function reverseMap(str) {
    return str.replace(/[!@#$%^&*()]/g, m => MAP[m] || m);
  }

  // XOR simple con la clave fija original
  const KEY = 147;

  function xorDecode(bytes) {
    const out = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) {
      out[i] = bytes[i] ^ KEY;
    }
    return out;
  }

  // Decodificación principal (Base64 → XOR → texto)
  function decodePayload(b64) {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);

    for (let i = 0; i < bin.length; i++) {
      bytes[i] = bin.charCodeAt(i);
    }

    const decoded = xorDecode(bytes);
    return new TextDecoder().decode(decoded);
  }

  /* ============================================================
     📥 Cargar archivo users.enc y reconstruir la lista JSON
     ============================================================ */

  async function loadUsers() {
    try {
      const res = await fetch("users.enc");
      if (!res.ok) throw new Error("No se pudo cargar users.enc");

      const raw = await res.text();
      const cleaned = reverseMap(raw.trim()); // revertir sustitución

      const jsonText = decodePayload(cleaned); // descifrar

      const data = JSON.parse(jsonText);

      if (!Array.isArray(data)) throw new Error("Lista corrupta");

      return data;

    } catch (err) {
      console.error("❌ Error en decoder.loadUsers():", err);
      return null;
    }
  }

  return {
    loadUsers
  };

})();
