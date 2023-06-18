/**
 * The GameState class contains the playing ground data, as well as the current score 
 * and selection score data. It contains also the logic for the calculation of the 
 * amount of neighboring fields.
 */
export class GameState {
    score = 0;
    selectionScore = 0;
    movesLeft = true;
    state = "INIT"; // INIT / PLAY / GAMEOVER 

    // The actual playing ground. The 0's will be filled with numbers between
    // 1 and 5 to represent the colored bubbles. 
    playground = [
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
    ];

    // A map representing the currently highlighted bubbles. 0 means no 
    // higlight, 1 means that the bubble is currently highlighted due
    // to a mouseover or because the bubble is part of a highlighted
    // "bubble island".
    highlightmap = [
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
    ];

    constructor() {
        this.generatePlayground();
    }

    /**
     * Fills the playing field with random numbers between 1 and 5, and resets als score values.
     */
    generatePlayground() {
        for(let row = 0; row < 10; row++) {
            for(let col = 0; col < 10; col++) {
                let rand = Math.floor(Math.random() * 5) + 1;
                this.playground[row][col] = rand;
            }
        }

        this.score = 0;
        this.selectionScore = 0;
        this.movesLeft = true;
    }

    /**
     * Called when the mouse is clicked. Iterates over the current highlightmap and
     * pops all bubbles (set it to 0) and sets the new score  when there is a selectionScore 
     * greater than 0. A selectionScore > 0 means that there are currently more than 1 bubbles 
     * highlighted.
     * 
     * @returns A boolean value indicating whether a bubble was popped (true) or not (false)
     */
    popBubbles() {
        let pop = false;
        if(this.selectionScore > 0) {
            pop = true;
            for(let row = 0; row < 10; row++) {
                for(let col = 0; col < 10; col++) {
                    if(this.highlightmap[row][col] == 1) {
                        this.playground[row][col] = 0;
                    }
                }
            }
            this.score += this.selectionScore;
            this.rearrangeBubbles();
            this.movesLeft = this.checkmovesLeft();
        }
        return pop;
    }
    
    /**
     * Recursive method for calculating the number of color matching neighbors. If 2 or more
     * neighboring cells are found, the corresponding cell in the highlightmap gets
     * set to 1 so that this state later can be used for rendering and when the bubbles
     * are being popped. 
     * 
     * @param {int} row The row to be checked
     * @param {int} col The column to be checked
     * @param {int} value The value of the currently checked bubble
     * @returns Returns the sum of found neighboring cells with the same colored bubble. 
     */
    calcNeighbors(row, col, value) {
        let sum = 0;
        if(value == 0) {
            value = this.playground[row][col];
        }

        if(value != 0 && this.checkArrayBounds(row, col) && this.highlightmap[row][col] != 1 && this.playground[row][col] == value) {
            this.highlightmap[row][col] = 1;
            sum += 1;
            sum += this.calcNeighbors(row, col+1, value);
            sum += this.calcNeighbors(row, col-1, value);
            sum += this.calcNeighbors(row+1, col, value);
            sum += this.calcNeighbors(row-1, col, value);
        }
        return sum;
    }

    /**
     * Resets the highlightmap to 0
     */
    resetHighlights() {
        for(let row = 0; row < 10; row++) {
            for(let col = 0; col < 10; col++) {
                this.highlightmap[row][col] = 0;
            }
        }
    }

    // Helper method for checking the bound of the playing ground array.
    checkArrayBounds(row, col) {
        return col >= 0 && row >= 0 && col < this.playground[0].length && row < this.playground.length;
    }

    /**
     * A method for rearrange the bubbles on the playing field, if some bubbles were
     * popped. 
     */
    rearrangeBubbles() {
        for(let col = 0; col < 10; col++) {
            let offset = 0;
            for(let row = 9; row >= 0; row--) {
                let value = this.playground[row][col];
                if(value == 0) {
                    offset++;
                }
                else {
                    this.playground[row][col] = 0;
                    this.playground[row + offset][col] = value;
                }
            }
        }
    }

    /**
     * Checks whether there are still moves left. There are moves left until at least
     * two color matching bubbles are neighboring horizontally or vertically. 
     * @returns True if there are moves left, false if not.
     */
    checkmovesLeft() {
        // Check Rows
        for(let row = 0; row < 10; row++) {
            for(let col = 0; col < 10; col++) {
                let val1 = this.playground[row][col];
                if(val1 == 0) {
                    continue;
                }
                if(col < 9) {
                    let val2 = this.playground[row][col+1];
                    if(val1 == val2) {
                        return true;
                    }
                }
                if(row < 9) {
                    let val3 = this.playground[row+1][col];
                    if(val1 == val3) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

}