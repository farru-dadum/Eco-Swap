const homeBtn = document.getElementById("homeBtn");
const aboutBtn = document.getElementById("aboutBtn");
const section3 = document.querySelector(".section3");
const section4 = document.querySelector(".section4");
const sectionabt = document.querySelector(".sectionabt");

// Ensure that Part1 is visible by default
section3.style.display = "flex";
section4.style.display = "flex";
sectionabt.style.display = "none";

homeBtn.addEventListener("click", function () {
    section3.style.display = "flex";  
    section4.style.display = "flex"; 
    sectionabt.style.display = "none";
});

aboutBtn.addEventListener("click", function () {
    section3.style.display = "none";  
    section4.style.display = "none"; 
    sectionabt.style.display = "flex";
});