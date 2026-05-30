const fs = require("fs");
const mineflayer = require("mineflayer");
const { pathfinder, Movements, goals } = require("mineflayer-pathfinder");
let lobbyF = false;
let bot;

console.clear();
console.log("6b6t bot by Carlox\nhttps://github.com/CarloxCoC/SpamBot\nv1.2\n");

const config = JSON.parse(fs.readFileSync("./config.json", "utf-8"));

function isInLobby() {
  if (!bot || !bot.game || bot.game.difficulty != "hard") {
    if (!lobbyF) leaveLobby();
    return true;
  } else {
    return false;
  }
}

// leave the lobby
async function leaveLobby() {
  lobbyF = true;

  bot.controlState.forward = true;
  await bot.waitForTicks(40);
  bot.controlState.forward = false;

  while (bot?.game?.difficulty != "hard") {
    bot.controlState.back = true;
    await bot.waitForTicks(20);
    bot.controlState.back = false;

    bot.controlState.forward = true;
    await bot.waitForTicks(30);
    bot.controlState.forward = false;
  }

  lobbyF = false;
}

const main = () => {
  let forceStop = false;
  bot = mineflayer.createBot({
    host: "6b6t.org",
    username: config.username,
    version: "1.21.5",
    skipValidation: true,
  });

  // Baritone (pathfinder) yükle
  bot.loadPlugin(pathfinder);

  bot.once("spawn", async () => {
    // Baritone hareketlerini ayarla
    const defaultMove = new Movements(bot);
    bot.pathfinder.setMovements(defaultMove);

    let lobbyCount = 0;
    while (!forceStop) {
      await bot.waitForTicks(20);
      if (lobbyCount > 30) {
        bot.end();
        break;
      }
      if (!bot.entity) continue;
      if (!bot.entity.position) continue;
      if (isInLobby()) lobbyCount++;
    }
  });

  bot.once("login", async () => {
    await bot.waitForTicks(100);
    bot.chat("/register " + config.password);
    await bot.waitForTicks(100);
    bot.chat("/login " + config.password);
    console.log("Giriş yapıldı.");
  });

  // Sohbet komutları (Baritone kontrolü)
  bot.on("chat", (username, message) => {
    if (username === bot.username) return;
    if (config.admins && !config.admins.includes(username.toLowerCase())) return;

    const args = message.trim().split(" ");
    const cmd = args[0].toLowerCase();

    if (cmd === "goto") {
      const x = parseInt(args[1]);
      const y = parseInt(args[2]);
      const z = parseInt(args[3]);
      if (isNaN(x) || isNaN(y) || isNaN(z)) {
        bot.chat("Kullanım: goto <x> <y> <z>");
        return;
      }
      const { GoalBlock } = goals;
      bot.pathfinder.setGoal(new GoalBlock(x, y, z));
      bot.chat(`Hedefe gidiyorum: ${x} ${y} ${z}`);
    }

    if (cmd === "stop") {
      bot.pathfinder.setGoal(null);
      bot.chat("Durdum.");
    }

    if (cmd === "pos") {
      const pos = bot.entity.position;
      bot.chat(`Konum: ${Math.floor(pos.x)} ${Math.floor(pos.y)} ${Math.floor(pos.z)}`);
    }
  });

  bot.on("error", (err) => {
    console.log(err);
    bot.end();
  });

  bot.on("kicked", (err) => {
    console.log(err);
    bot.end();
  });

  bot.on("end", () => {
    bot.removeAllListeners();
    bot = null;
    forceStop = true;
    setTimeout(main, 5000);
  });
};

main();
s
