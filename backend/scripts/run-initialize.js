// Helper script to run the initialization with ES modules
import { exec } from "child_process";

// Run the initialize script with Node.js using ES modules
exec(
  "node --experimental-modules --es-module-specifier-resolution=node scripts/initialize-bandejas.js",
  (error, stdout, stderr) => {
    if (error) {
      console.error(`Execution error: ${error}`);
      return;
    }

    console.log(stdout);

    if (stderr) {
      console.error(`Stderr: ${stderr}`);
    }
  }
);
