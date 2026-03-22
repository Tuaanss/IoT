const config = require("./config");
const app = require("./app");

const PORT = config.PORT;
app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
