
export function initInteractionLogic(){

    const menuButton = document.getElementById("menuButton")!;
    const menuContent = document.getElementById("menuContent")!;
    const dropdown = document.getElementById("changeMode")!;

    menuButton.addEventListener("click", function () {
        menuContent.classList.toggle("show");
    });

    document.addEventListener("click", function (event: MouseEvent) {
        const target = event.target;
        if (target instanceof Element && !target.closest(".dropdown")) {
            menuContent.classList.remove("show");
        }
    });


    dropdown.addEventListener("click", function () {
        document.body.classList.toggle("dark-mode");
    });

}

