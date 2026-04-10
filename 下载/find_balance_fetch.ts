import axios from "axios";

async function findBalanceFetch() {
  try {
    const url = "https://lighthouse.cantonloop.com/assets/index-BHAvs6mx.js";
    const response = await axios.get(url);
    const content = response.data;
    
    const target = "balance";
    let index = -1;
    while ((index = content.indexOf(target, index + 1)) !== -1) {
      const context = content.substring(index - 100, index + 100);
      if (context.includes("fetch") || context.includes("api") || context.includes("get")) {
        console.log("Found context for 'balance':");
        console.log(context);
        console.log("---");
      }
    }

  } catch (error: any) {
    console.error("Error:", error.message);
  }
}

findBalanceFetch();
