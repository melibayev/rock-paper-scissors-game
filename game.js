const crypto = require('crypto');
const readline = require('readline');

class MoveRules {
    constructor(moves) {
      this.moves = moves;
    }
  
    getWinner(move) {
      const index = this.moves.indexOf(move);
      const numMoves = this.moves.length;
      const halfNumMoves = Math.floor(numMoves / 2);
  
      const wins = this.moves.slice(index + 1, index + 1 + halfNumMoves);
      const loses = this.moves.slice(index - halfNumMoves, index);
  
      return { wins, loses };
    }
}

class RandomKeyGenerator {
  static generateKey() {
    const keyLength = 32; // 256 bits
    return crypto.randomBytes(keyLength).toString('hex');
  }
}

class HMACCalculator {
  static calculateHMAC(move, key) {
    const hmac = crypto.createHmac('sha256', key);
    hmac.update(move);
    return hmac.digest('hex');
  }
}

class GameTable {
    static generateTable(moves) {
      const numMoves = moves.length;
      const table = [['Move', ...moves]];
  
      for (const move of moves) {
        const row = [move];
        for (const otherMove of moves) {
          if (move === otherMove) {
            row.push('Draw');
          } else {
            const { wins, loses } = new MoveRules(moves).getWinner(move);
            if (wins.includes(otherMove)) {
              row.push('Win');
            } else if (loses.includes(otherMove)) {
              row.push('Lose');
            } else {
              row.push('Draw');
            }
          }
        }
        table.push(row);
      }
  
      return table;
    }
  
    static displayTable(table) {
      for (const row of table) {
        console.log(row.join('\t'));
      }
    }
}

class NonTransitiveGame {
  constructor(moves) {
    this.moves = moves;
    this.moveRules = new MoveRules(moves);
    this.key = RandomKeyGenerator.generateKey();
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  async play() {
    const randomIndex = Math.floor(Math.random() * this.moves.length);
    const computerMove = this.moves[randomIndex];
    const hmac = HMACCalculator.calculateHMAC(computerMove, this.key);

    console.log(`HMAC: ${hmac}`);
    console.log('Menu:');
    this.moves.forEach((move, index) => console.log(`${index + 1} - ${move}`));
    console.log('0 - Exit');
    console.log('? - Help');
    console.log(`Key: ${this.key}`);

    const userMoveIndex = await this.getUserMoveIndex();
    if (userMoveIndex === 0) {
      console.log('Goodbye!');
    } else if (userMoveIndex === -1) {
      const table = GameTable.generateTable(this.moves);
      GameTable.displayTable(table);
      await this.play(); // Continue the game after displaying the help table
    } else {
      const userMove = this.moves[userMoveIndex - 1];
      const { wins, loses } = this.moveRules.getWinner(userMove);

      console.log(`Your move: ${userMove}`);
      console.log(`Computer's move: ${computerMove}`);

      if (wins.includes(computerMove)) {
        console.log('You win!');
      } else if (loses.includes(computerMove)) {
        console.log('You lose!');
      } else {
        console.log('It\'s a draw!');
      }

      this.rl.close();
    }
  }

  async getUserMoveIndex() {
    return new Promise((resolve) => {
      this.rl.question('Enter your move: ', (input) => {
        if (input === '?') {
          resolve(-1); // User asked for help
        } else if (this.isValidInput(input)) {
          resolve(parseInt(input));
        } else {
          console.log('Invalid input. Please try again.');
          resolve(this.getUserMoveIndex());
        }
      });
    });
  }

  isValidInput(input) {
    const number = parseInt(input);
    return !isNaN(number) && number >= 0 && number <= this.moves.length;
  }
}

function main() {
  const args = process.argv.slice(2);
  if (args.length < 3 || args.length % 2 === 0 || new Set(args).size !== args.length) {
    console.error('Incorrect input. Please provide an odd number (>=3) of non-repeating strings as moves.');
    console.error('Example: node game.js Rock Paper Scissors');
    return;
  }

  const moves = args;
  const game = new NonTransitiveGame(moves);
  game.play();
}

main();
