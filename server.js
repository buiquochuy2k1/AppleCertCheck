const express = require("express");
const multer = require("multer");
const fs = require("fs");
const forge = require("node-forge");
const ocsp = require("ocsp");
const axios = require("axios");

const app = express();
const upload = multer({ dest: "uploads/" });

// Parse file .p12 thành PEM
function parseP12ToPem(filePath, password) {
  const p12Buffer = fs.readFileSync(filePath);
  const p12Der = forge.util.createBuffer(p12Buffer.toString("binary"), "binary");
  const p12Asn1 = forge.asn1.fromDer(p12Der);
  const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, password || "");

  const bags = p12.getBags({ bagType: forge.pki.oids.certBag });
  const cert = bags[forge.pki.oids.certBag][0].cert;
  const pem = forge.pki.certificateToPem(cert);

  return { cert, pem };
}

// Lấy Issuer URL (.der) và OCSP URL
function getUrls(cert) {
  const aia = cert.getExtension("authorityInfoAccess");
  if (!aia) return {};

  const issuerMatch = aia.value.match(/http[^\s]+\.der/);
  const ocspMatch = aia.value.match(/http[^\s]+ocsp[^\s"]*/);

  return {
    issuerUrl: issuerMatch ? issuerMatch[0] : null,
    ocspUrl: ocspMatch ? ocspMatch[0] : null
  };
}

// Download issuer cert (DER → PEM)
async function downloadIssuerPem(url) {
  const res = await axios.get(url, { responseType: "arraybuffer" });
  const derBuf = res.data;
  const der = forge.util.createBuffer(derBuf.toString("binary"), "binary");
  const asn1 = forge.asn1.fromDer(der);
  const cert = forge.pki.certificateFromAsn1(asn1);
  return forge.pki.certificateToPem(cert);
}

// Endpoint upload
app.post("/check", upload.single("p12"), async (req, res) => {
  if (!req.file) {
    return res.status(400).send("Thiếu file P12");
  }

  try {
    const { cert, pem } = parseP12ToPem(req.file.path, req.body.password);
    const { issuerUrl, ocspUrl } = getUrls(cert);

    if (!issuerUrl || !ocspUrl) {
      return res.send(`
        <div style="color:red; text-align:center; font-weight:bold;">
          Không tìm thấy Issuer hoặc OCSP URL trong cert
        </div>
      `);
    }

    const issuerPem = await downloadIssuerPem(issuerUrl);

    ocsp.check({ cert: pem, issuer: issuerPem, url: ocspUrl }, (err, result) => {
      let statusHtml;

      if (err) {
        // Nếu error message chứa revoked
        if (err.message && err.message.includes("revoked")) {
          statusHtml = "<span style='color:red; font-weight:bold;'>🔴 Thu hồi / Revoked 🔴</span>";
        } else {
          console.error("OCSP error:", err);
          return res.send(`
            <div style="color:red; text-align:center; font-weight:bold;">
              ⚠ Không kiểm tra được OCSP
            </div>
          `);
        }
      } else if (result.type === "good") {
        statusHtml = "<span style='color:green; font-weight:bold;'>🟢 Hợp lệ</span>";
      } else if (result.type === "revoked") {
        statusHtml = "<span style='color:red; font-weight:bold;'>🔴 Thu hồi / Revoked 🔴</span>";
      } else {
        statusHtml = "<span style='color:orange; font-weight:bold;'>❓ Unknown</span>";
      }

      res.send(`
        <div style="text-align:center; font-family:Arial, sans-serif;">
          <h3>Kết quả kiểm tra</h3>
          <p><b>Tên chứng chỉ:</b> ${cert.subject.getField("CN").value}</p>
          <p><b>Ngày hết hạn:</b> ${cert.validity.notAfter.toLocaleDateString("vi-VN")}</p>
          <p><b>Tình trạng:</b> ${statusHtml}</p>
        </div>
      `);
    });
  } catch (e) {
    console.error(e);
    res.send(`
      <div style="color:red; text-align:center; font-weight:bold;">
        Sai mật khẩu hoặc file không hợp lệ!
      </div>
    `);
  }
});

// phục vụ index.html từ thư mục public
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`Server chạy ở http://localhost:${PORT}`)
);
