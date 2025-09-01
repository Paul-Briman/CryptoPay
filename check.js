import bcrypt from "bcrypt";

const password = "saymyname100";
const hash = "$2b$10$Ze.Pun.BBRIgwGJCrLmIiOFpLT53kXilugZWwfWdz2C9YectXK05m";

bcrypt.compare(password, hash, function(err, result) {
  if (result) {
    console.log("✅ Password matches!");
  } else {
    console.log("❌ Password does not match.");
  }
});
