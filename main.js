require("./config.js")
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  makeInMemoryStore,
  jidDecode,
  downloadContentFromMessage,
  delay,
  fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const { delArrSave } = require('./lib/arrfunction.js')
const fs = require('fs')
const path = require('path')
const { Boom } = require("@hapi/boom");
const yargs = require('yargs/yargs')
const _ = require('lodash')
const colors = require('@colors/colors/safe')
const chalk = require("chalk")
const moment = require('moment-timezone')
const PhoneNumber = require("awesome-phonenumber");
const FileType = require('file-type')
const readline = require("readline");
const {
  smsg,
  imageToWebp,
  videoToWebp,
  sleep,
  writeExifImg,
  writeExifVid,
  toPTT,
  toAudio,
  toVideo,
  getSizeMedia
} = require("./all/myfunc")

const {
  getBuffer,
  getTime,
  tanggal,
  toRupiah,
  telegraPh,
  pinterest,
  ucapan,
  generateProfilePicture
} = require('./all/function.js')

const axios = require("axios")
const { color } = require('./all/color');

const moji = ['📚', '💭', '💫', '🌌', '🌏', '✨', '🌷', '🍁', '🪻'];
const randomemoji = moji[Math.floor(Math.random() * moji.length)];
const listcolor = ['aqua', 'red', 'blue', 'purple', 'magenta'];
const randomcolor = listcolor[Math.floor(Math.random() * listcolor.length)];
const randomcolor2 = listcolor[Math.floor(Math.random() * listcolor.length)];
const randomcolor3 = listcolor[Math.floor(Math.random() * listcolor.length)];
const randomcolor4 = listcolor[Math.floor(Math.random() * listcolor.length)];
const randomcolor5 = listcolor[Math.floor(Math.random() * listcolor.length)];

global.opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse())
const DataBase = require('./lib/database');
const database = new DataBase();
(async () => {
  const loadData = await database.read()
  if (loadData && Object.keys(loadData).length === 0) {
    global.db = {
      users: {},
      groups: {},
      database: {},
      settings: {},
      ...(loadData || {}),
    }
    await database.write(global.db)
  } else {
    global.db = loadData
  }

  setInterval(async () => {
    if (global.db) await database.write(global.db)
  }, 3500)
})();

require("events").EventEmitter.defaultMaxListeners = 600;


const deleteFolderRecursive = function (pathsesi) {
  if (fs.existsSync(pathsesi)) {
    fs.readdirSync(pathsesi).forEach(function (file, index) {
      const curPath = pathsesi + '/' + file;
      if (fs.lstatSync(curPath).isDirectory()) { // recurse
        deleteFolderRecursive(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(pathsesi);
  }
}

if (global.db) setInterval(async () => {
  if (global.db.data) await global.db.write()
}, 30 * 1000)

const question = (text) => { const rl = readline.createInterface({ input: process.stdin, output: process.stdout }); return new Promise((resolve) => { rl.question(text, resolve) }) };

const usePairingCode = true

async function startSession() {
 
  const store = makeInMemoryStore({ logger: pino().child({ level: 'silent', stream: 'store' }) })
  const { state, saveCreds } = await useMultiFileAuthState(`./session`)
  const { version, isLatest } = await fetchLatestBaileysVersion()

  const getMessage = async (key) => {
    if (store) {
      try {
        const msg = await store.loadMessage?.(key.remoteJid, key.id, undefined)
        return msg?.message || undefined
      } catch (e) {
        return undefined
      }
    }
    return {
      conversation: 'hello'
    }
  }

  const connectionOptions = {
    version,
    isLatest,
    getMessage,
    keepAliveIntervalMs: 30000,
    printQRInTerminal: !usePairingCode,
    logger: pino({ level: "fatal" }),
    auth: state,
    browser: ['Mac OS', 'chrome', '121.0.6167.159']
  }

  const VeronicaX = makeWASocket(connectionOptions)

  store.bind(VeronicaX.ev);

  if (usePairingCode && !VeronicaX.authState.creds.registered) {
    const phoneNumber = await question(color('Enter WhatsApp Number Starting with 256:\n', 'gold'));
    const code = await VeronicaX.requestPairingCode(phoneNumber.trim())
    console.log(`${chalk.redBright('Your Pairing Code')} : ${code}`)
  }

  VeronicaX.ev.on("messages.upsert", async (chatUpdate) => {
    try {
      mek = chatUpdate.messages[0];
      if (!mek.message) return;
      mek.message = Object.keys(mek.message)[0] === "ephemeralMessage" ? mek.message.ephemeralMessage.message : mek.message;
      if (mek.key && mek.key.remoteJid === "status@broadcast") return;
      if (mek.key.id && mek.key.id.startsWith("BAE5") && mek.key.id.length === 16) return;
      m = smsg(VeronicaX, mek, store);
      require("./Veronica.js")(VeronicaX, m, chatUpdate, mek, store);
    } catch (err) {
      console.log(err);
    }
  });

  VeronicaX.decodeJid = (jid) => {
    if (!jid) return jid;
    if (/:\d+@/gi.test(jid)) {
      let decode = jidDecode(jid) || {};
      return (decode.user && decode.server && decode.user + "@" + decode.server) || jid;
    } else return jid;
  };

  VeronicaX.getName = (jid, withoutContact = false) => {
    id = VeronicaX.decodeJid(jid);
    withoutContact = VeronicaX.withoutContact || withoutContact;
    let v;
    if (id.endsWith("@g.us"))
      return new Promise(async (resolve) => {
        v = store.contacts[id] || {};
        if (!(v.name || v.subject)) v = VeronicaX.groupMetadata?.(id) || {};
        resolve(v.name || v.subject || PhoneNumber("+" + id.replace("@s.whatsapp.net", "")).getNumber("international"));
      });
    else
      v =
        id === "0@s.whatsapp.net"
          ? {
            id,
            name: "WhatsApp",
          }
          : id === VeronicaX.decodeJid(VeronicaX.user.id)
            ? VeronicaX.user
            : store.contacts[id] || {};
    return (withoutContact ? "" : v.name) || v.subject || v.verifiedName || PhoneNumber("+" + jid.replace("@s.whatsapp.net", "")).getNumber("international");
  };

  VeronicaX.serializeM = (m) => smsg(VeronicaX, m, store);

  VeronicaX.ev.on("connection.update", async (koneksi) => {
    const { connection, lastDisconnect } = koneksi

    if (connection === "connecting") {
      
    }

    if (connection == "open") {
      console.log(color(`╔══════════════════════════════════════╗`, `${randomcolor}`));
      console.log(color(`║     ✨️  Whatsapp Connected ✅        ║`, `${randomcolor}`));
      console.log(color(`╚══════════════════════════════════════╝`, `${randomcolor}`));
      console.log(color(`🟢  Welcome to VeronicaAi database 🧬`));
      console.log(color(`📡  Establishing secure link with VeronicaAi Core 🔐`));
      console.log(color(`🛰️  Syncing with VeronicaAi data stream...`));
      console.log(color(`🧠  Initializing VeronicaAi intelligence protocol...`));
      console.log(color(`📂  Accessing encrypted VeronicaAi archives 🔍`));
      console.log(color(`🔗  Linking VeronicaAi network nodes...`));
      console.log(color(`⚙️  VeronicaAi system boot sequence completed ✅`));
      console.log(color('👀  Connected to ' + JSON.stringify(VeronicaX.user.id, null, 2)));
      await sleep(2000);
      if (global.startup === true) {
        VeronicaX.sendMessage(VeronicaX.user.id.split(":")[0] + "@s.whatsapp.net", {
          text: `\`\`\`Connection established\`\`\``
        })
      }
    }

    if (connection === "close" && lastDisconnect && lastDisconnect.error && lastDisconnect.error.output && lastDisconnect.error.output.statusCode != 401) {
      // reconnect
      startSession()
    }
    
    if (connection === "close" && lastDisconnect && lastDisconnect.error && lastDisconnect.error.output && lastDisconnect.error.output.statusCode == 401) {
      console.log('Connection closed. You are logged out. Remove session folder to re-login.')
    }
  })

  // save credentials on update
  VeronicaX.ev.on("creds.update", saveCreds);

  // convenience wrappers (keep as before)
  VeronicaX.sendText = (jid, text, quoted = "", options) => VeronicaX.sendMessage(jid, { text: text, ...options }, { quoted });

  VeronicaX.sendContact = async (jid, kon, desk = "Developer Bot", quoted = '', opts = {}) => {
    let list = []
    for (let i of kon) {
      list.push({
        displayName: global.botname || "VeronicaAi",
        vcard:
          'BEGIN:VCARD\n' +
          'VERSION:3.0\n' +
          `N:;${global.botname || "VeronicaAi"};;;\n` +
          `FN:${global.botname || "VeronicaAi"}\n` +
          'ORG:null\n' +
          'TITLE:\n' +
          `item1.TEL;waid=${i}:${i}\n` +
          'item1.X-ABLabel:Ponsel\n' +
          `X-WA-BIZ-DESCRIPTION:${desk}\n` +
          `X-WA-BIZ-NAME:${global.botname || "VeronicaAi"}\n` +
          'END:VCARD'
      })
    }
    VeronicaX.sendMessage(jid, { contacts: { displayName: `${list.length} contacts`, contacts: list }, ...opts }, { quoted })
  }

  VeronicaX.downloadMediaMessage = async (message) => {
    let mime = (message.msg || message).mimetype || ''
    let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]
    const stream = await downloadContentFromMessage(message, messageType)
    let buffer = Buffer.from([])
    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk])
    }
    return buffer
  }

  VeronicaX.sendImageAsSticker = async (jid, path, quoted, options = {}) => {
    let buff = Buffer.isBuffer(path)
      ? path
      : /^data:.*?\/.*?;base64,/i.test(path)
        ? Buffer.from(path.split(',')[1], 'base64')
        : /^https?:\/\//.test(path)
          ? await getBuffer(path)
          : fs.existsSync(path)
            ? fs.readFileSync(path)
            : Buffer.alloc(0);
    let buffer;
    if (options && (options.packname || options.author)) {
      buffer = await writeExifImg(buff, options);
    } else {
      buffer = await imageToWebp(buff);
    }
    await VeronicaX.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted });
    return buffer;
  };

  VeronicaX.sendVideoAsSticker = async (jid, path, quoted, options = {}) => {
    let buff = Buffer.isBuffer(path)
      ? path
      : /^data:.*?\/.*?;base64,/i.test(path)
        ? Buffer.from(path.split(',')[1], 'base64')
        : /^https?:\/\//.test(path)
          ? await getBuffer(path)
          : fs.existsSync(path)
            ? fs.readFileSync(path)
            : Buffer.alloc(0);
    let buffer;
    if (options && (options.packname || options.author)) {
      buffer = await writeExifVid(buff, options);
    } else {
      buffer = await videoToWebp(buff);
    }
    await VeronicaX.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted });
    return buffer;
  };

  VeronicaX.reply = (jid, text = '', quoted, options) => {
    return Buffer.isBuffer(text) ? this.sendFile(jid, text, 'file', '', quoted, false, options) : VeronicaX.sendMessage(jid, { ...options, text }, { quoted, ...options })
  }

  VeronicaX.sendMedia = async (jid, path, quoted, options = {}) => {
    let { ext, mime, data } = await VeronicaX.getFile(path)
    let messageType = mime.split("/")[0]
    let pase = messageType.replace('application', 'document') || messageType
    return await VeronicaX.sendMessage(jid, { [pase]: data, mimetype: mime, ...options }, { quoted })
  }

  VeronicaX.getFile = async (PATH, save) => {
    let res
    let data = Buffer.isBuffer(PATH)
      ? PATH
      : /^data:.*?\/.*?;base64,/i.test(PATH)
        ? Buffer.from(PATH.split(',')[1], 'base64')
        : /^https?:\/\//.test(PATH)
          ? (res = await getBuffer(PATH))
          : fs.existsSync(PATH)
            ? fs.readFileSync(PATH)
            : typeof PATH === 'string'
              ? Buffer.from(PATH)
              : Buffer.alloc(0)

    if (res && res.data && !(data && data.length)) {
      data = Buffer.from(res.data)
    } else if (res && Buffer.isBuffer(res)) {
      data = res
    }

    let type = await FileType.fromBuffer(data) || { mime: 'application/octet-stream', ext: 'bin' }

    let filename = path.join(__dirname, './tmp/' + new Date().getTime() + '.' + type.ext)

    if (data && save) await fs.promises.writeFile(filename, data)

    return { res, filename, size: await getSizeMedia(data), ...type, data }
  }

  VeronicaX.sendFile = async (jid, path, filename = '', caption = '', quoted, ptt = false, options = {}) => {
    let type = await VeronicaX.getFile(path, true)
    let { res, data: file, filename: pathFile } = type
    if ((res && res.status && res.status !== 200) || (file && file.length <= 65536)) {
      try { throw { json: JSON.parse(file.toString()) } }
      catch (e) { if (e.json) throw e.json }
    }
    let opt = { filename }
    if (quoted) opt.quoted = quoted
    if (!type) options.asDocument = true
    let mtype = '', mimetype = type.mime, convert
    if (/webp/.test(type.mime) || (/image/.test(type.mime) && options.asSticker)) mtype = 'sticker'
    else if (/image/.test(type.mime) || (/webp/.test(type.mime) && options.asImage)) mtype = 'image'
    else if (/video/.test(type.mime)) mtype = 'video'
    else if (/audio/.test(type.mime)) (
      convert = await (ptt ? toPTT : toAudio)(file, type.ext),
      file = convert.data,
      pathFile = convert.filename,
      mtype = 'audio',
      mimetype = 'audio/ogg; codecs=opus'
    )
    else mtype = 'document'
    if (options.asDocument) mtype = 'document'

    let message = {
      ...options,
      caption,
      ptt,
      [mtype]: { url: pathFile },
      mimetype
    }
    let m
    try {
      m = await VeronicaX.sendMessage(jid, message, { ...opt, ...options })
    } catch (e) {
      console.error(e)
      m = null
    } finally {
      if (!m) m = await VeronicaX.sendMessage(jid, { ...message, [mtype]: file }, { ...opt, ...options })
      return m
    }
  }

  VeronicaX.downloadAndSaveMediaMessage = async (message, filename, attachExtension = true) => {
    let quoted = message.m ? message.m : message
    let mime = (message.m || message).mimetype || ''
    let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]
    const stream = await downloadContentFromMessage(quoted, messageType)
    let buffer = Buffer.from([])
    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk])
    }
    let type = await FileType.fromBuffer(buffer)
    let trueFileName = attachExtension ? (filename + '.' + type.ext) : filename
    // save to file
    await fs.writeFileSync(trueFileName, buffer)
    return trueFileName
  }

  return VeronicaX;
}

startSession().catch(err => {
  console.error("Failed to start session:", err)
});

// auto-reload for this file
let file = require.resolve(__filename);
fs.watchFile(file, () => {
  fs.unwatchFile(file);
  console.log(`Update ${__filename}`);
  delete require.cache[file];
  require(file);
});