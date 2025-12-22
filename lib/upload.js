const fetch = require('node-fetch');
const FormData = require('form-data');
const fileType = require('file-type');

module.exports = async function uploadimage(buffer) {
  const ext = (await fileType.fromBuffer(buffer)).ext;
  const bodyForm = new FormData();
  bodyForm.append("fileToUpload", buffer, `file.${ext}`);
  bodyForm.append("reqtype", "fileupload");
  const res = await fetch("https://catbox.moe/user/api.php", {
    method: "POST",
    body: bodyForm,
  });
  const data = await res.text();
  return data;
}