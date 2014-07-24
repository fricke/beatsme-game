var countdownMsgs = ['Ready!', 'Set!', 'Go!', 'Pick a card, any card!', 'Hurry!'];

Polymer('beatsme-game', {
  loadedCards: 0,
  game: null,
  currentPlayer: null,
  hand: [],
  winningId: null,
  winningCard: null,
  page: 0,
  externalController: null,
  numGuesses: 0,
  timeSelected: 0,
  pickedWinner: false,
  handOver: false,
  skipped: false,
  timeout: false,
  domReady: function(){
    if(this.gameId) {
        var ajax = this.shadowRoot.querySelector('core-ajax#getGame');
        ajax.go();
    } else {
        var ajax = this.shadowRoot.querySelector('core-ajax#startGame');
        ajax.go();
    }
    this.player = this.shadowRoot.querySelector('beatsme-player');
    this.clientId = this.clientId || localStorage.getItem('clientId');
    this.externalController = this.shadowRoot.querySelector('paper-progress#winningTimeline');
    //player.addEventListener('hand-ended', this.onHandComplete.bind(this));
  },
  reset: function(){
    this.hand = [];
    this.loadedCards = 0;
    this.page = 0;
    this.numGuesses = 0;
    this.timeSelected = 0;
    this.pickedWinner = false;
    this.handOver = false;
    this.timeout = false;
    this.skipped = false;
  },
  pickNewCards: function(){
    if(!this.pickedWinner && !this.handOver) {
      this.skipped = true;
      this.updateScore();
    }
    this.reset();
    this.shadowRoot.querySelector('core-animated-pages').removeAttribute('hidden');
    this.shadowRoot.querySelector('h1#gameStartCountdown').innerHTML = "";
    var ajax = this.shadowRoot.querySelector('core-ajax#getHand');
    this.player.stop();
    ajax.go();
  },

  handleGameResponse: function(event, response) {
    var game = response.response.data;
    this.game = game;
    this.hand = game.current_hand.cards;

    //TODO: Need to add players and fix points
    this.currentPlayer = game.players[0];
    this.currentPlayer.points = this.currentPlayer.points || 0;
    this.showScore();
  },
  handleNewHandResponse: function(event, response) {
    this.reset();
    var newHand = response.response.data;
    this.game.current_hand = newHand;
    this.hand = newHand.cards;
  },
  handleHandEnded: function() {
    this.handOver = true;
    if(!this.pickedWinner) {
        this.page = 1;
        this.timeout = true;
        this.updateScore();
        this.player.setProgressRed();
    }
  },

  handleCardLoaded: function(event) {
    this.loadedCards++;
    if(this.loadedCards === 4) {
      this.showHand();
    }
  },
  handleUpdatePoints: function(event, response) {
    this.currentPlayer = response.response.data.player;

    //TODO: Set this up for multiple players
    this.game.players[0] = this.currentPlayer;

    this.showScore();
  },
  updateScore: function() {
    var ajax = this.shadowRoot.querySelector('core-ajax#updatePoints');
    ajax.go();
  },
  showScore: function(){
    this.shadowRoot.querySelector('span#currentPoints').innerHTML = this.currentPlayer.points;
  },
  showHand: function() {
    var that = this;
    var count = 0;
    var countdownEl = that.shadowRoot.querySelector('h1#gameStartCountdown');

    var winningId = that.winningId = that.game.current_hand.winning_id;
    that.shadowRoot.querySelector('core-animated-pages').removeAttribute('hidden');
    that.game.current_hand.cards.forEach(function(card){
      if(card.id === winningId) {
        that.winningCard = that.shadowRoot.querySelector('beatsme-game-card#card_' + card.id);
      }
    });
    that.shadowRoot.querySelector("paper-fab").removeAttribute('hidden');
  },
  cardGuess: function(event) {
    var guessedId = event.target.track.id;
    this.numGuesses++;

    if(guessedId === this.winningId) {
      this.timeSelected = this.player.getTime();
      this.player.stopClipProgress();
      this.showWinningCard();
      this.updateScore();
      this.pickedWinner = true;
    } else {
      this.player.flashRed();
    }
  },
  showWinningCard: function() {
    this.page = 1;
  }
});
