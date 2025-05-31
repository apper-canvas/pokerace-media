import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import ApperIcon from '../components/ApperIcon'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-md mx-auto"
      >
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
          className="mb-8"
        >
          <ApperIcon name="Spade" className="w-24 h-24 mx-auto text-gold" />
        </motion.div>
        
        <h1 className="text-6xl font-bold text-white mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gold mb-6">Table Not Found</h2>
        <p className="text-surface-300 mb-8 leading-relaxed">
          Looks like you've wandered away from the poker table. 
          The cards you're looking for aren't in this deck.
        </p>
        
        <Link
          to="/"
          className="inline-flex items-center space-x-2 bg-gradient-to-r from-primary to-primary-light hover:from-primary-light hover:to-primary text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
        >
          <ApperIcon name="ArrowLeft" className="w-5 h-5" />
          <span>Back to Game</span>
        </Link>
      </motion.div>
    </div>
  )
}