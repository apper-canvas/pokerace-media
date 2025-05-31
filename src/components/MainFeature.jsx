import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-toastify'
import ApperIcon from './ApperIcon'

const SUITS = ['♠', '♥', '♦', '♣']
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']

const createDeck = () => {
  const deck = []
  SUITS.forEach(suit => {
    RANKS.forEach(rank => {
      deck.push({ suit, rank, id: `${rank}${suit}` })
    })
  })
  return deck.sort(() => Math.random() - 0.5)
}

const GAME_PHASES = {
  WAITING: 'waiting',
  PREFLOP: 'preflop',
  FLOP: 'flop',
  TURN: 'turn',
  RIVER: 'river',
  SHOWDOWN: 'showdown'
}

const PLAYER_POSITIONS = [
  { id: 0, name: 'You', x: '50%', y: '85%', transform: 'translate(-50%, -50%)' },
  { id: 1, name: 'Player 2', x: '15%', y: '60%', transform: 'translate(-50%, -50%)' },
  { id: 2, name: 'Player 3', x: '15%', y: '30%', transform: 'translate(-50%, -50%)' },
  { id: 3, name: 'Player 4', x: '50%', y: '15%', transform: 'translate(-50%, -50%)' },
  { id: 4, name: 'Player 5', x: '85%', y: '30%', transform: 'translate(-50%, -50%)' },
  { id: 5, name: 'Player 6', x: '85%', y: '60%', transform: 'translate(-50%, -50%)' }
]

export default function MainFeature() {
  const [gamePhase, setGamePhase] = useState(GAME_PHASES.WAITING)
  const [players, setPlayers] = useState([
    { id: 0, name: 'You', chips: 1000, cards: [], currentBet: 0, hasFolded: false, isActive: true, isDealer: false },
    { id: 1, name: 'Player 2', chips: 1000, cards: [], currentBet: 0, hasFolded: false, isActive: true, isDealer: false },
    { id: 2, name: 'Player 3', chips: 1000, cards: [], currentBet: 0, hasFolded: false, isActive: true, isDealer: true }
  ])
  const [communityCards, setCommunityCards] = useState([])
  const [pot, setPot] = useState(0)
  const [currentBet, setCurrentBet] = useState(0)
  const [activePlayer, setActivePlayer] = useState(0)
  const [deck, setDeck] = useState(createDeck())
  const [betAmount, setBetAmount] = useState(0)
  const [showCards, setShowCards] = useState(false)

const calculateHandStrength = (playerCards, communityCards) => {
    if (!playerCards || playerCards.length < 2) return 0
    
    const allCards = [...playerCards, ...communityCards]
    if (allCards.length < 2) return 0
    
    // Convert cards to numerical values for easier comparison
    const getCardValue = (rank) => {
      if (rank === 'A') return 14
      if (rank === 'K') return 13
      if (rank === 'Q') return 12
      if (rank === 'J') return 11
      return parseInt(rank)
    }
    
    const cardValues = allCards.map(card => ({
      value: getCardValue(card.rank),
      suit: card.suit,
      rank: card.rank
    })).sort((a, b) => b.value - a.value)
    
    // Check for different hand types
    const suits = {}
    const values = {}
    
    cardValues.forEach(card => {
      suits[card.suit] = (suits[card.suit] || 0) + 1
      values[card.value] = (values[card.value] || 0) + 1
    })
    
    const suitCounts = Object.values(suits)
    const valueCounts = Object.values(values).sort((a, b) => b - a)
    const uniqueValues = Object.keys(values).map(Number).sort((a, b) => b - a)
    
    // Check for flush
    const hasFlush = suitCounts.some(count => count >= 5)
    
    // Check for straight
    let hasStraight = false
    if (uniqueValues.length >= 5) {
      for (let i = 0; i <= uniqueValues.length - 5; i++) {
        if (uniqueValues[i] - uniqueValues[i + 4] === 4) {
          hasStraight = true
          break
        }
      }
      // Check for A-2-3-4-5 straight (wheel)
      if (!hasStraight && uniqueValues.includes(14) && uniqueValues.includes(5) && 
          uniqueValues.includes(4) && uniqueValues.includes(3) && uniqueValues.includes(2)) {
        hasStraight = true
      }
    }
    
    // Determine hand strength
    if (hasFlush && hasStraight) return 95 // Straight flush
    if (valueCounts[0] === 4) return 90 // Four of a kind
    if (valueCounts[0] === 3 && valueCounts[1] === 2) return 85 // Full house
    if (hasFlush) return 75 // Flush
    if (hasStraight) return 70 // Straight
    if (valueCounts[0] === 3) return 65 // Three of a kind
    if (valueCounts[0] === 2 && valueCounts[1] === 2) return 55 // Two pair
    if (valueCounts[0] === 2) return 45 // One pair
    
    // High card strength based on highest cards
    const highCardStrength = Math.min(40, (uniqueValues[0] - 2) * 3 + (uniqueValues[1] - 2))
    return highCardStrength
  }
  
  const getHandStrengthLabel = (strength) => {
    if (strength >= 90) return 'Excellent'
    if (strength >= 75) return 'Very Strong'
    if (strength >= 65) return 'Strong'
    if (strength >= 55) return 'Good'
    if (strength >= 45) return 'Fair'
    if (strength >= 30) return 'Weak'
    return 'Very Weak'
  }
  
  const getHandStrengthPercentage = (strength) => {
    return Math.min(99, Math.max(1, Math.round(strength)))
  }
  
  const getHandStrengthColor = (strength) => {
    if (strength >= 70) return 'text-green-400'
    if (strength >= 50) return 'text-yellow-400'
    return 'text-red-400'
  }

  const dealCards = () => {
    const newDeck = [...deck]
    const updatedPlayers = players.map(player => {
      if (player.isActive && !player.hasFolded) {
        return {
          ...player,
          cards: [newDeck.pop(), newDeck.pop()]
        }
      }
      return player
    })
    
    setPlayers(updatedPlayers)
    setDeck(newDeck)
    setGamePhase(GAME_PHASES.PREFLOP)
    setShowCards(true)
    setPot(30) // Blinds
    setCurrentBet(20)
    toast.success('Cards dealt! Game begins!')
  }

  const handlePlayerAction = (action, amount = 0) => {
    const player = players[activePlayer]
    
    if (action === 'fold') {
      setPlayers(prev => prev.map(p => 
        p.id === activePlayer ? { ...p, hasFolded: true } : p
      ))
      toast.info(`${player.name} folds`)
    } else if (action === 'call') {
      const callAmount = currentBet - player.currentBet
      setPlayers(prev => prev.map(p => 
        p.id === activePlayer 
          ? { ...p, currentBet: currentBet, chips: p.chips - callAmount }
          : p
      ))
      setPot(prev => prev + callAmount)
      toast.success(`${player.name} calls $${callAmount}`)
    } else if (action === 'raise') {
      const raiseAmount = amount || betAmount
      const totalBet = currentBet + raiseAmount
      setPlayers(prev => prev.map(p => 
        p.id === activePlayer 
          ? { ...p, currentBet: totalBet, chips: p.chips - (totalBet - p.currentBet) }
          : p
      ))
      setPot(prev => prev + (totalBet - player.currentBet))
      setCurrentBet(totalBet)
      toast.success(`${player.name} raises to $${totalBet}`)
    } else if (action === 'check') {
      toast.info(`${player.name} checks`)
    }

    // Move to next active player
    let nextPlayer = (activePlayer + 1) % players.length
    while (players[nextPlayer]?.hasFolded || !players[nextPlayer]?.isActive) {
      nextPlayer = (nextPlayer + 1) % players.length
      if (nextPlayer === activePlayer) break
    }
    setActivePlayer(nextPlayer)
  }

  const nextPhase = () => {
    const newDeck = [...deck]
    
    if (gamePhase === GAME_PHASES.PREFLOP) {
      setCommunityCards([newDeck.pop(), newDeck.pop(), newDeck.pop()])
      setGamePhase(GAME_PHASES.FLOP)
      toast.success('Flop revealed!')
    } else if (gamePhase === GAME_PHASES.FLOP) {
      setCommunityCards(prev => [...prev, newDeck.pop()])
      setGamePhase(GAME_PHASES.TURN)
      toast.success('Turn revealed!')
    } else if (gamePhase === GAME_PHASES.TURN) {
      setCommunityCards(prev => [...prev, newDeck.pop()])
      setGamePhase(GAME_PHASES.RIVER)
      toast.success('River revealed!')
    } else if (gamePhase === GAME_PHASES.RIVER) {
      setGamePhase(GAME_PHASES.SHOWDOWN)
      toast.success('Showdown!')
    }
    
    setDeck(newDeck)
    setCurrentBet(0)
    setPlayers(prev => prev.map(p => ({ ...p, currentBet: 0 })))
  }

  const resetGame = () => {
    setGamePhase(GAME_PHASES.WAITING)
    setPlayers(prev => prev.map(p => ({ 
      ...p, 
      cards: [], 
      currentBet: 0, 
      hasFolded: false, 
      isActive: true 
    })))
    setCommunityCards([])
    setPot(0)
    setCurrentBet(0)
    setActivePlayer(0)
    setDeck(createDeck())
    setShowCards(false)
    setBetAmount(0)
    toast.info('New game started!')
  }

  const Card = ({ card, isHidden = false, className = "" }) => (
    <motion.div
      initial={{ rotateY: 180 }}
      animate={{ rotateY: isHidden ? 180 : 0 }}
      transition={{ duration: 0.6 }}
      className={`poker-card w-12 h-16 sm:w-16 sm:h-20 md:w-20 md:h-28 flex items-center justify-center text-xs sm:text-sm md:text-base font-bold ${className}`}
      style={{ transformStyle: 'preserve-3d' }}
    >
      {isHidden ? (
        <div className="card-back w-full h-full flex items-center justify-center">
          <ApperIcon name="Spade" className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
        </div>
      ) : (
        <div className={`text-center ${card?.suit === '♥' || card?.suit === '♦' ? 'card-suit-red' : 'card-suit-black'}`}>
          <div className="text-lg sm:text-xl md:text-2xl">{card?.suit}</div>
          <div className="text-xs sm:text-sm font-bold">{card?.rank}</div>
        </div>
      )}
    </motion.div>
  )

  const currentPlayer = players[activePlayer]
  const canCheck = currentBet === 0 || currentPlayer?.currentBet === currentBet
  const canCall = currentBet > 0 && currentPlayer?.currentBet < currentBet
  const callAmount = currentBet - (currentPlayer?.currentBet || 0)

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="text-center mb-6 sm:mb-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center space-x-3 mb-4"
        >
          <ApperIcon name="Spade" className="w-8 h-8 sm:w-10 sm:h-10 text-gold" />
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white text-shadow">
            PokerAce
          </h1>
          <ApperIcon name="Heart" className="w-8 h-8 sm:w-10 sm:h-10 text-secondary" />
        </motion.div>
        <p className="text-surface-300 text-sm sm:text-base">
          Texas Hold'em Poker • Phase: {gamePhase.toUpperCase()}
        </p>
      </div>

      {/* Main Game Table */}
      <div className="max-w-6xl mx-auto">
        <div className="relative poker-table w-full h-96 sm:h-[500px] lg:h-[600px] mb-6 sm:mb-8">
          
          {/* Pot Display */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="pot-display"
            >
              <div className="flex items-center space-x-2 mb-2">
                <ApperIcon name="Coins" className="w-5 h-5 text-gold" />
                <span className="text-white font-semibold text-sm sm:text-base">Pot</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-gold">${pot}</div>
              {currentBet > 0 && (
                <div className="text-xs sm:text-sm text-surface-300 mt-1">
                  Current bet: ${currentBet}
                </div>
              )}
            </motion.div>
          </div>

          {/* Community Cards */}
          <AnimatePresence>
            {communityCards.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-20 sm:top-24 left-1/2 transform -translate-x-1/2 flex space-x-2 sm:space-x-3"
              >
                {communityCards.map((card, index) => (
                  <motion.div
                    key={card.id}
                    initial={{ rotateY: 180 }}
                    animate={{ rotateY: 0 }}
                    transition={{ delay: index * 0.2 }}
                  >
                    <Card card={card} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Players */}
          {PLAYER_POSITIONS.slice(0, players.length).map((position, index) => {
            const player = players[index]
            if (!player || !player.isActive) return null

            return (
              <motion.div
                key={player.id}
                className="player-seat"
                style={{
                  left: position.x,
                  top: position.y,
                  transform: position.transform
                }}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                {/* Player Info */}
                <div className={`text-center p-2 sm:p-3 rounded-xl backdrop-blur-sm border ${
                  activePlayer === index ? 'bg-gold bg-opacity-20 border-gold pulse-glow' : 'bg-black bg-opacity-30 border-surface-600'
                }`}>
                  <div className="text-white font-semibold text-xs sm:text-sm mb-1">
                    {player.name}
                    {players.find(p => p.isDealer)?.id === player.id && (
                      <span className="ml-1 text-gold">D</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-1 text-xs">
                    <ApperIcon name="Coins" className="w-3 h-3 text-gold" />
                    <span className="text-gold">${player.chips}</span>
                  </div>
                  {player.currentBet > 0 && (
                    <div className="text-xs text-surface-300 mt-1">
                      Bet: ${player.currentBet}
                    </div>
                  )}
                  {player.hasFolded && (
                    <div className="text-xs text-secondary mt-1">Folded</div>
                  )}
                </div>

{/* Player Cards */}
                {player.cards.length > 0 && (
                  <div className="space-y-2 mt-2">
                    <div className="flex space-x-1">
                      {player.cards.map((card, cardIndex) => (
                        <Card
                          key={cardIndex}
                          card={card}
                          isHidden={index !== 0 || !showCards}
                          className={player.hasFolded ? 'opacity-50' : ''}
                        />
                      ))}
                    </div>
                    
                    {/* Hand Strength Indicator */}
                    {!player.hasFolded && (index === 0 || gamePhase === GAME_PHASES.SHOWDOWN) && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 }}
                        className="bg-black bg-opacity-50 rounded-lg px-2 py-1 border border-surface-600"
                      >
                        {(() => {
                          const strength = calculateHandStrength(player.cards, communityCards)
                          const percentage = getHandStrengthPercentage(strength)
                          const label = getHandStrengthLabel(strength)
                          const colorClass = getHandStrengthColor(strength)
                          
                          return (
                            <div className="text-center">
                              <div className={`text-xs font-bold ${colorClass}`}>
                                {percentage}%
                              </div>
                              <div className={`text-xs ${colorClass}`}>
                                {label}
                              </div>
                            </div>
                          )
                        })()}
                      </motion.div>
                    )}
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>

        {/* Game Controls */}
        <div className="bg-surface-800 rounded-2xl p-4 sm:p-6 border border-surface-600">
          {gamePhase === GAME_PHASES.WAITING ? (
            <div className="text-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={dealCards}
                className="betting-button bg-gradient-to-r from-primary to-primary-light text-white hover:from-primary-light hover:to-primary"
              >
                <ApperIcon name="Play" className="w-5 h-5 mr-2" />
                Deal Cards
              </motion.button>
            </div>
          ) : gamePhase === GAME_PHASES.SHOWDOWN ? (
            <div className="text-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={resetGame}
                className="betting-button bg-gradient-to-r from-gold to-gold-dark text-white hover:from-gold-dark hover:to-gold"
              >
                <ApperIcon name="RotateCcw" className="w-5 h-5 mr-2" />
                New Game
              </motion.button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Current Player Info */}
              <div className="text-center text-white">
                <div className="text-sm text-surface-300 mb-1">Current Player</div>
                <div className="text-lg font-semibold">{currentPlayer?.name}</div>
              </div>

              {/* Player Actions */}
              {activePlayer === 0 && !currentPlayer?.hasFolded && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handlePlayerAction('fold')}
                    className="betting-button bg-gradient-to-r from-secondary to-secondary-light text-white hover:from-secondary-light hover:to-secondary"
                  >
                    Fold
                  </motion.button>

                  {canCheck ? (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handlePlayerAction('check')}
                      className="betting-button bg-gradient-to-r from-surface-600 to-surface-500 text-white hover:from-surface-500 hover:to-surface-400"
                    >
                      Check
                    </motion.button>
                  ) : canCall ? (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handlePlayerAction('call')}
                      className="betting-button bg-gradient-to-r from-primary to-primary-light text-white hover:from-primary-light hover:to-primary"
                    >
                      Call ${callAmount}
                    </motion.button>
                  ) : null}

                  <div className="col-span-2 flex space-x-2">
                    <input
                      type="number"
                      value={betAmount}
                      onChange={(e) => setBetAmount(Math.max(0, parseInt(e.target.value) || 0))}
                      placeholder="Amount"
                      className="flex-1 px-3 py-2 bg-surface-700 border border-surface-600 rounded-lg text-white text-sm focus:outline-none focus:border-gold"
                      min="0"
                      max={currentPlayer?.chips}
                    />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handlePlayerAction('raise')}
                      disabled={betAmount <= 0 || betAmount > currentPlayer?.chips}
                      className="betting-button bg-gradient-to-r from-gold to-gold-dark text-white hover:from-gold-dark hover:to-gold"
                    >
                      Raise
                    </motion.button>
                  </div>
                </div>
              )}

              {/* Auto-advance for demo */}
              <div className="text-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={nextPhase}
                  disabled={gamePhase === GAME_PHASES.RIVER}
                  className="betting-button bg-gradient-to-r from-surface-600 to-surface-500 text-white hover:from-surface-500 hover:to-surface-400 text-xs"
                >
                  Next Phase (Demo)
                </motion.button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}