import { GameView } from "./gameView.js";
import { GameState } from "./gameState.js";

/**
 * The central controller class of the game. Performs the game loop, state management, all 
 * necessary checks and serves as intermediary between the GameState and GameView class.
 */
export class Game {
    gameView = null;
    gameState = null;
    assets = null;
    openRequests = 0;

    mouseX = 0;
    mouseY = 0;
    activeRow = 0;
    activeCol = 0;

    canvasWidth = 640;
    canvasHeight = 960;
    canvasScale = 1;

    playgroundFrame = { x: 0, y: 130, width: 640, height: 640 }; // A virtual frame for the position of the playing field 
    newgameButtonFrame = { x: 200, y: 815, width: 240, height: 119 }; // A virtual frame for the position of the new game button 

    /**
     * The start-method is called when the game is started. It performs the loading
     * of all necessary assets, and creates all necessarry objects. After this
     * initialization process is done, it calls the update-method which takes over
     * the further handling of the game.
     */
    start() {
        this.assets = {};

        this.assets["background"] = this.loadImage("./img/background.png");
        this.assets["gameover"] = this.loadImage("./img/gameover.png");
        this.assets["newgame1"] = this.loadImage("./img/newgame1.png");
        this.assets["newgame2"] = this.loadImage("./img/newgame2.png");
        this.assets["highlight_bubble1"] = this.loadImage("./img/highlight_bubble1.png");
        this.assets["highlight_bubble2"] = this.loadImage("./img/highlight_bubble2.png");
        this.assets["highlight_bubble3"] = this.loadImage("./img/highlight_bubble3.png");
        this.assets["highlight_bubble4"] = this.loadImage("./img/highlight_bubble4.png");
        this.assets["highlight_bubble5"] = this.loadImage("./img/highlight_bubble5.png");
        this.assets["bubble1"] = this.loadImage("./img/bubble1.png");
        this.assets["bubble2"] = this.loadImage("./img/bubble2.png");
        this.assets["bubble3"] = this.loadImage("./img/bubble3.png");
        this.assets["bubble4"] = this.loadImage("./img/bubble4.png");
        this.assets["bubble5"] = this.loadImage("./img/bubble5.png");
        this.assets["sfx_pop"] = this.loadSound("./sound/pop.mp3");
        this.assets["sfx_gameover"] = this.loadSound("./sound/gameover.mp3");

        this.gameView = new GameView(this.assets, this.canvasWidth, this.canvasHeight);
        this.gameState = new GameState();

        this.update();
    }

    /**
     * Called once per frame. It performs various actions and checks based on the current game state.
     */
    update() {
        var _this = this;
        requestAnimationFrame(
            function () {
                _this.update();
            }
        );

        switch (this.gameState.state) {

            // Loading State: Waits until all Assets are loaded and switches to PLAY state
            case "INIT":
                this.gameView.drawLoadingScreen();
                if (this.openRequests == 0) {
                    this.gameState.state = "PLAY";

                    // Adding event handler for movement and clicks. 
                    // The event handlers are only added here to ensure that 
                    // actions are only executed when the corresponding areas are visible.
                    var _this = this;
                    this.gameView.canvas.addEventListener('mousemove', function (event) { _this.onMouseMove(event); });
                    this.gameView.canvas.addEventListener('click', function (event) { _this.onMouseClick(event); });
                }
                break;

            // Within this state the actual game is being performed. the currently highlighted bubbles 
            // are calculated once per frame and the screen rendering is performed. 
            // It also checks if the game is over and performs the transition if so. 
            case "PLAY":
                this.gameState.resetHighlights();
                let sum = this.gameState.calcNeighbors(this.activeRow, this.activeCol, 0);
                this.gameState.selectionScore = (sum * (sum -1)) * 10; 
                this.drawScreen();

                if (!this.gameState.movesLeft) {
                    this.assets["sfx_pop"].pause();
                    this.assets["sfx_gameover"].play();
                    this.gameState.state = "GAMEOVER";
                }
                break;

            // Draws the screen with an Game Over overlay. 
            case "GAMEOVER":
                this.drawScreen();
                this.gameView.drawGameOverOverlay(this.gameState.score);
                break;
        }


    }

    /**
     * Performs the rendering of the playing ground and the new game button.
     */
    drawScreen() {
        this.gameView.drawPlayground(this.gameState.playground, this.gameState.highlightmap, this.gameState.score, this.gameState.selectionScore);
        this.gameView.drawNewGameButton(this.isPointInsideFrame(this.newgameButtonFrame, this.mouseX, this.mouseY), this.newgameButtonFrame.x, this.newgameButtonFrame.y);
    }

    /**
     * Event Handler for mouse move events. If the movement was inside the playing field,
     * it performs the calculation of the currently overed cell.
     * @param {Event} event 
     */
    onMouseMove(event) {
        this.calcMousePosition(event);

        if (this.isPointInsideFrame(this.playgroundFrame, this.mouseX, this.mouseY)) {
            this.calcHoveredCell();
        }
    }

    /**
     * An event handler for mouse click events. It checks if the click was inside the 
     * playing field or inside the New Game button and performs the respective action.
     * @param {MouseEvent} event 
     */
    onMouseClick(event) {
        this.calcMousePosition(event);

        // Playground / Bubble is clicked
        if (this.isPointInsideFrame(this.playgroundFrame, this.mouseX, this.mouseY)) {
            this.calcHoveredCell();
            let popped = this.gameState.popBubbles(this.activeRow, this.activeCol);

            // Play sound if bubbles were Popped
            if (popped) {
                this.assets["sfx_pop"].pause();
                this.assets["sfx_pop"].currentTime = 0;
                this.assets["sfx_pop"].play();
            }
        }

        // New Game is clicked
        else if (this.isPointInsideFrame(this.newgameButtonFrame, this.mouseX, this.mouseY)) {
            this.gameState.generatePlayground();
            this.gameState.state = "PLAY";
        }
    }

    /**
     * Calculates local mouse coordinates, relative to the canvas location on the screen
     * and cosidering the current scale of the canvas.
     * @param {MouseEvent} event 
     */
    calcMousePosition(event) {
        const rect = this.gameView.canvas.getBoundingClientRect();
        this.canvasScale = rect.width / this.canvasWidth;

        this.mouseX = (event.clientX - rect.left);
        this.mouseY = (event.clientY - rect.top);
    }

    /**
     * This Method calculates the cell which is currently hovered by the mouse, if any. 
     * If the mouse is out of the playing field's bounds, it sets the cell to the nearest
     * possible value. 
     */
    calcHoveredCell() {
        const offset = 150 * this.canvasScale;
        const cellWdth = 64 * this.canvasScale;
        const cellHeight = 64 * this.canvasScale;

        this.activeRow = Math.floor((this.mouseY - offset) / cellHeight);
        this.activeCol = Math.floor(this.mouseX / cellWdth);

        if (this.activeRow < 0) {
            this.activeRow = 0;
        }
        else if (this.activeRow > 9) {
            this.activeRow = 9;
        }

        if (this.activeCol < 0) {
            this.activeCol = 0;
        }
        else if (this.activeCol > 9) {
            this.activeCol = 9;
        }
    }

    /**
     * Checks whether a point lays inside a frame. 
     * @param {Rectangle} frame The frame on which is checked
     * @param {int} x X-Coordinate
     * @param {int} y Y-Coordinate
     * @returns True if the point is inside the frame, false if not
     */
    isPointInsideFrame(frame, x, y) {
        const fx = frame.x * this.canvasScale;
        const fy = frame.y * this.canvasScale;
        const fw = frame.width * this.canvasScale;
        const fh = frame.height * this.canvasScale;

        return (
            x >= fx &&
            x <= fx + fw &&
            y >= fy &&
            y <= fy + fh
        );
    }


    /**
     * Loads an Image from the requested url
     * @param {string} url The url of the image
     * @returns The requested Image
     */
    loadImage(url) {
        const image = new Image();

        var _this = this;

        image.onload = function () {
            _this.openRequests--;
        };

        image.onerror = function () {
            _this.openRequests--;
        };

        image.src = url;
        _this.openRequests++;

        return image;
    }

    /**
     * Loads an Audio file from the requested url
     * @param {string} url The url of the audio file
     * @returns The requested Audio file
     */
    loadSound(url) {
        var sound = new Audio();
        var _this = this;

        let f = function () {
            sound.removeEventListener("canplaythrough", f);
            _this.openRequests--;
        };

        sound.addEventListener('canplaythrough', f);
        sound.addEventListener('error', function (e) {
            _this.openRequests--;
        });

        sound.src = url;
        sound.load();  // add this line
        _this.openRequests++;

        return sound;
    }


}