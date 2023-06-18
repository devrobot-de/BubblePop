/**
 * The GameView class performs all render operations.
 */
export class GameView {
    assets = null;
    canvas = null;
    context = null;
    playgroundOffet = 150; // The position where the playingfield is displayed relatively to the top corner of the canvas. 

    /**
     * Performs the visual initialization of the game. Sets some CSS values so that 
     * the game is displayed correctly.
     * 
     * @param {object} assets An object which contains all game assets
     * @param {int} width The desired canvas width
     * @param {int} height The desired canvas height
     */
    constructor(assets, width, height) {
        this.assets = assets;
        document.body.style.margin = "0";
        document.body.style.padding = "0";
        document.body.style.backgroundColor = "black";
        document.body.style.width = "100%";
        document.body.style.height = "100vh";

        let container = document.getElementById("gamecontainer");
        container.style.height = "100vh";
        container.style.display = "flex";
        container.style.justifyContent = "center";
        container.style.alignItems = "center";

        
        let canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.style.maxWidth = "100%";
        canvas.style.maxHeight = "100%";
        container.appendChild(canvas);

        this.canvas = canvas;
        this.context = canvas.getContext("2d");
    }

    /**
     * Renders the playing ground with all the bubbles on the canvas. Based on the current
     * highlight state of the bubbles, they are visually represendet differently.
     * 
     * @param {array} playground An array containing the playing field with all bubble values
     * @param {array} highlightmap An array containing the current highlight state of each bubble
     * @param {int} score The current score for state-rendering purposes
     * @param {int} selectionScore The score of the current selection for state-rendering purposes
     */
    drawPlayground(playground, highlightmap, score, selectionScore) {
        let canvas = this.canvas;
        let context = this.context;
        let offsetY = this.playgroundOffet;

        context.fillStyle = "#2c133c"; // Base blue background
        context.fillRect(0, 0, canvas.width, canvas.height);

        let background = this.assets["background"];
        context.drawImage(background, 0, 0);

        for(let row = 0; row < 10; row++) {
            for(let col = 0; col < 10; col++) {
                let x = col * 64;
                let y = row * 64 + offsetY;
                let value = playground[row][col];

                let highlightBubble = this.assets["highlight_bubble"+value];
                let bubble = this.assets["bubble" + value];
                
                if(value == 0) continue;

                if(highlightmap[row][col] == 1) {
                    context.drawImage(highlightBubble, x, y, 64, 64);
                }
                else {
                    context.drawImage(bubble, x, y, 64, 64);
                }

                
            }
        }

        // Text rendering
        context.font = '28px Arial'; 
        context.fillStyle = 'white'; 

        let textWidth = context.measureText(score).width;
        context.fillText(score, 147 - (textWidth / 2), 67); 
        
        textWidth = context.measureText(selectionScore).width;
        context.fillText(selectionScore, 487 - (textWidth / 2), 67);
    }

    /**
     * Renders the "New Game" Button based on its current mouse hover state. 
     * @param {bool} active A boolean value indicating whether the button is currently hovered by the mouse
     * @param {int} x X-Coordinate fore placement on the canvas
     * @param {int} y Y-Coordinate fore placement on the canvas
     */
    drawNewGameButton(active, x, y) {
        let button = null;
        
        if(!active) {
            button = this.assets["newgame1"];
        }
        else {
            button = this.assets["newgame2"];
        }
        this.context.drawImage(button, x, y);
    }

    /**
     * Draws a "Game Over" overlay with the final score above the playground. 
     * @param {int} score The final score
     */
    drawGameOverOverlay(score) {
        let overlay = this.assets["gameover"];;
        this.context.drawImage(overlay, 105,300);
        this.context.font = '28px Arial';
        this.context.fillStyle = 'white'; 
        let textWidth = this.context.measureText(score).width;
        this.context.fillText(score, 320 - (textWidth / 2), 469); 
    }

    /**
     * Draws a simple Loading-Screen on the canvas. 
     */
    drawLoadingScreen() {
        this.context.fillStyle = "#2c133c";
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
        const text = "LOADING...";
        this.context.font = '38px Arial'; 
        this.context.fillStyle = 'white'; 
        let textWidth = this.context.measureText(text).width;
        this.context.fillText(text, 320 - (textWidth / 2), 469); 
    }

}