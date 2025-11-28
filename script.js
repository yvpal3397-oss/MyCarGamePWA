// Get canvas and context
const canvas = document.getElementById('gameCanvas');
if (!canvas || !canvas.getContext) {
    console.error("Canvas element not found or 2D context not supported.");
    document.body.innerHTML = "<h1>Error: Canvas element not supported or missing.</h1>";
} else {
    const ctx = canvas.getContext('2d');

    // --- Game Parameters ---
    const roadWidth = 200; 
    const grassWidth = (canvas.width - roadWidth) / 2; 
    const carWidth = 30;
    const carHeight = 50;
    let carX = canvas.width / 2 - carWidth / 2; 
    const carY = canvas.height - 70; 
    const carSpeed = 5;
    const objectSpeed = 4; 

    let score = 0; 
    let gameOver = false; 

    // Track Assets
    const treeSpeed = 3;
    let trees = []; 
    let obstacles = []; 
    let coins = [];     

    // Input Handling
    let leftPressed = false;
    let rightPressed = false;
    
    // ----------------------------------------------------
    // Touch Control Logic on Canvas
    
    function handleTouch(e) {
        // Prevent default touch behavior (like scrolling)
        e.preventDefault(); 
        
        // Get the touch location relative to the canvas
        const rect = canvas.getBoundingClientRect();
        const touchX = e.touches[0].clientX - rect.left;
        
        // Check if the touch is on the left half or right half of the canvas
        if (touchX < canvas.width / 2) {
            // Touch on left half
            leftPressed = true;
            rightPressed = false;
        } else {
            // Touch on right half
            rightPressed = true;
            leftPressed = false;
        }
    }
    
    function stopTouch() {
        leftPressed = false;
        rightPressed = false;
    }

    // Attach touch event listeners to the canvas
    canvas.addEventListener('touchstart', handleTouch);
    canvas.addEventListener('touchmove', handleTouch); 
    canvas.addEventListener('touchend', stopTouch);
    canvas.addEventListener('touchcancel', stopTouch);
    // ----------------------------------------------------

    // --- Utility Functions ---

    function getRandomLaneX() {
        const roadStartX = grassWidth;
        const lane1 = roadStartX + roadWidth/6 - carWidth/2; 
        const lane2 = roadStartX + roadWidth/2 - carWidth/2; 
        const lane3 = roadStartX + roadWidth*5/6 - carWidth/2; 

        const lanePositions = [lane1, lane2, lane3];
        return lanePositions[Math.floor(Math.random() * lanePositions.length)];
    }

    // --- Draw Functions ---

    function drawTrack() {
        ctx.fillStyle = "#8BC34A"; 
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        const roadStartX = grassWidth;
        ctx.fillStyle = "#424242"; 
        ctx.fillRect(roadStartX, 0, roadWidth, canvas.height);
        ctx.strokeStyle = "white";
        ctx.lineWidth = 4;
        ctx.setLineDash([10, 10]); 
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2, 0);
        ctx.lineTo(canvas.width / 2, canvas.height);
        ctx.stroke();
        ctx.setLineDash([]); 
    }

    function drawTree(x, y) {
        ctx.fillStyle = "#795548"; 
        ctx.fillRect(x + 10, y + 30, 10, 20); 
        ctx.beginPath();
        ctx.arc(x + 15, y + 30, 20, 0, Math.PI * 2, true); 
        ctx.fillStyle = "#4CAF50"; 
        ctx.fill();
        ctx.closePath();
    }

    function drawAnimatedTrees() {
        if (Math.random() < 0.05) { 
            const side = Math.random() < 0.5 ? 'left' : 'right';
            let xPos;
            if (side === 'left') {
                xPos = Math.random() * (grassWidth - 40); 
            } else {
                xPos = roadWidth + grassWidth + Math.random() * (grassWidth - 40); 
            }
            trees.push({ x: xPos, y: -50 }); 
        }

        for (let i = 0; i < trees.length; i++) {
            trees[i].y += treeSpeed; 
            drawTree(trees[i].x, trees[i].y);
        }
        trees = trees.filter(tree => tree.y < canvas.height);
    }
    
    function drawCar() {
        ctx.fillStyle = "#FF0000"; 
        ctx.fillRect(carX, carY, carWidth, carHeight);
        ctx.fillStyle = "#FFFFFF"; 
        ctx.fillRect(carX + carWidth * 0.1, carY + carHeight * 0.1, carWidth * 0.8, carHeight * 0.3);
        ctx.fillStyle = "#FFFF00"; 
        ctx.fillRect(carX + 2, carY + carHeight - 8, 8, 5); 
        ctx.fillRect(carX + carWidth - 10, carY + carHeight - 8, 8, 5); 
        ctx.fillStyle = "#000000"; 
        ctx.fillRect(carX - 5, carY + 35, 5, 10); 
        ctx.fillRect(carX + carWidth, carY + 35, 5, 10); 
        ctx.fillRect(carX - 5, carY + 5, 5, 10); 
        ctx.fillRect(carX + carWidth, carY + 5, 5, 10); 
    }

    function drawObstacle(obstacle) {
        ctx.fillStyle = "#8B0000"; 
        ctx.fillRect(obstacle.x, obstacle.y, 30, 40); 
        ctx.fillStyle = "#FFFF00"; 
        ctx.font = "bold 25px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("!", obstacle.x + 15, obstacle.y + 20); 
    }

    function drawCoin(coin) {
        ctx.beginPath();
        ctx.arc(coin.x + 10, coin.y + 10, 10, 0, Math.PI * 2, true);
        ctx.fillStyle = "#FFD700"; 
        ctx.fill();
        ctx.closePath();
        ctx.beginPath();
        ctx.arc(coin.x + 13, coin.y + 7, 5, 0, Math.PI, false); 
        ctx.fillStyle = "rgba(255, 255, 255, 0.7)"; 
        ctx.fill();
        ctx.closePath();
    }

    function updateObstacles() {
        obstacles.forEach(obstacle => {
            obstacle.y += objectSpeed;
            if (carX < obstacle.x + obstacle.width &&
                carX + carWidth > obstacle.x &&
                carY < obstacle.y + obstacle.height &&
                carY + carHeight > obstacle.y) {
                
                gameOver = true; 
                alert("Game Over! Your Score is: " + score + ". Press OK to restart.");
                document.location.reload(); 
            }
        });
        obstacles = obstacles.filter(obstacle => obstacle.y < canvas.height);
    }
    
    function updateCoins() {
        coins.forEach((coin, index) => {
            coin.y += objectSpeed;
            const dx = (carX + carWidth/2) - (coin.x + 10);
            const dy = (carY + carHeight/2) - (coin.y + 10);
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < (carWidth/2 + coin.radius)) {
                score += 10; 
                coins.splice(index, 1); 
            }
        });
        coins = coins.filter(coin => coin.y < canvas.height);
    }

    function spawnObjects() {
        if (Math.random() < 0.02) { 
            obstacles.push({ x: getRandomLaneX(), y: -50, width: 30, height: 40 });
        }
        if (Math.random() < 0.03) { 
            coins.push({ x: getRandomLaneX(), y: -50, radius: 10 });
        }
    }
    
    function drawScore() {
        ctx.font = "20px Arial";
        ctx.fillStyle = "white";
        ctx.fillText("SCORE: " + score, 10, 20);
    }

    // --- Game Loop ---
    function draw() {
        if (gameOver) return; 

        drawTrack();
        drawAnimatedTrees();

        spawnObjects(); 

        updateObstacles(); 
        obstacles.forEach(drawObstacle);

        updateCoins(); 
        coins.forEach(drawCoin);

        drawCar();

        // Update Car Position (Movement Logic based on touch state)
        const minCarX = grassWidth;
        const maxCarX = canvas.width - grassWidth - carWidth;
        
        if (rightPressed) {
            carX += carSpeed;
        } else if (leftPressed) {
            carX -= carSpeed;
        }
        
        carX = Math.max(minCarX, Math.min(carX, maxCarX));
        
        drawScore(); 

        requestAnimationFrame(draw); 
    }

    // Start the Game
    draw();
}
