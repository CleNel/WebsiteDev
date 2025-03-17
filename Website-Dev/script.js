const adhdButton = document.getElementById("adhdButton");
const score = document.getElementById("score");
const progressBar = document.getElementById("progressBar");

const circles = document.getElementsByClassName("circle");
let interval;
let ratio;

adhdButton.addEventListener("click", function() {
    ahdhdMode();
});

function falling() {
    let c = document.createElement("div");
    c.setAttribute('class', 'circle')
    document.body.appendChild(c);
    c.style.left = Math.random() * window.innerWidth + "px";
    c.addEventListener("click", function() {
        progressBar.value += 100 * ratio;
        document.body.removeChild(c);
    })
    c.addEventListener("touchstart", function() {
        progressBar.value += 100 * ratio;
        document.body.removeChild(c);
    })
    setTimeout(function() {
        document.body.removeChild(c);
    }, 10000);

}

function ahdhdMode() {
    var display = score.style.display;
    if(display == 'flex') {
        score.style.display = 'none';
        clearInterval(interval);
    } else {
        score.style.display = 'flex';
        progressBar.max = 100;
        progressBar.value = 0;
        var level = 0;
        ratio = 0.2;
        document.querySelector('level').innerHTML = level;
        interval = setInterval(function(){
            falling();
            if(progressBar.value == 100) {
                progressBar.value = 0;
                ratio = ratio / 2;
                level++;
                document.querySelector('level').innerHTML = level;
            }
        },200);

    }

}
