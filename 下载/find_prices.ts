import axios from "axios";

async function findPrices() {
  try {
    const url = "https://lighthouse.cantonloop.com/assets/index-BHAvs6mx.js";
    const response = await axios.get(url);
    const content = response.data;
    
    const target = "/prices";
    const index = content.indexOf(target);
    if (index !== -1) {
      console.log("Found usage of /prices:");
      console.log(content.substring(index - 100, index + 100));
    } else {
      console.log("Not found");
    }

  } catch (error: any) {
    console.error("Error:", error.message);
  }
}

findPrices();
