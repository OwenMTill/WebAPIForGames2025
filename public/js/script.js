const itemContainer = document.getElementById("items-container");

const fetchItems = async ()=>{
    try{
        const response = await fetch("/items");
        if(!response.ok){
            throw new Error("Failed to get items");
        }

        const items = await response.json();
        console.log(items);

        itemContainer.innerHTML = "";

        items.forEach((item) => {
            const itemDiv = document.createElement("div");
            itemDiv.className = "item";
            itemDiv.innerHTML = `${item.name}`;
            itemContainer.appendChild(itemDiv);
        });
    }catch(error){
        console.error("Error: ", error);
        itemContainer.innerHTML = "<p style='color:red'>Failed to get items</p>";
    }
}

fetchItems();