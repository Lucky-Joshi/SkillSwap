const express = require('express');
const { protect, restrictTo } = require('../middleware/auth');
const {
  getStats,
  listUsers,
  deleteAllTestUsers,
  deleteSingleUser,
  resetDemo,
  purgeData,
  reseed,
} = require('../controllers/adminController');

const router = express.Router();

router.use(protect, restrictTo('admin'));

router.get('/stats', getStats);
router.get('/users', listUsers);
router.delete('/users/test', deleteAllTestUsers);
router.delete('/users/:id', deleteSingleUser);
router.post('/demo/reset', resetDemo);
router.delete('/data', purgeData);
router.post('/seed/reseed', reseed);

module.exports = router;
