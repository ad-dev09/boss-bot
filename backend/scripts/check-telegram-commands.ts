import { commandList, getCommandDefinition, telegramBotCommands } from "../src/bot/commands.js";
import { getGuideMessages, getHelpMessage } from "../src/bot/helpText.js";

const commands = commandList.map((definition) => definition.command);
const aliases = ["/manual", "/instructions"];
const guideMessages = getGuideMessages();
const requiredCommands = [
  "/start",
  "/help",
  "/guide",
  "/manual",
  "/instructions",
  "/status",
  "/projects",
  "/tasks",
  "/payments",
  "/providers",
  "/documents",
  "/today",
  "/report",
  "/addtask",
  "/addpayment",
  "/addproject",
  "/addprovider",
];

console.log("Supported commands:");
for (const command of commands) {
  console.log(`- ${command}`);
}

console.log("");
console.log(`Aliases: ${aliases.join(", ")}`);
console.log(`Telegram command menu entries: ${telegramBotCommands.length}`);
console.log(`Guide message sections: ${guideMessages.length}`);
console.log(
  `Longest guide section characters: ${Math.max(
    ...guideMessages.map((message) => message.length),
  )}`,
);
console.log(`Help includes /guide: ${getHelpMessage().includes("/guide") ? "yes" : "no"}`);

console.log("");
console.log("Registration checks:");
let failed = false;
for (const command of requiredCommands) {
  const registered = Boolean(getCommandDefinition(command));

  console.log(`${command}: ${registered ? "registered" : "missing"}`);
  failed ||= !registered;
}

failed ||= !getHelpMessage().includes("/guide");
failed ||= guideMessages.some((message) => message.length > 4096);

if (failed) {
  process.exitCode = 1;
}
