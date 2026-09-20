const authService = require('../services/authService');

async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Full name is required.' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Email address is required.' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    const { user, token } = await authService.registerUser({ name, email, password });

    return res.status(201).json({
      success: true,
      message: 'Citizen account registered successfully.',
      token,
      user
    });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const { user, token } = await authService.authenticateUser({ email, password });

    return res.json({
      success: true,
      message: 'Login successful.',
      token,
      user
    });
  } catch (err) {
    next(err);
  }
}

async function getMe(req, res) {
  return res.json({
    success: true,
    user: req.user
  });
}

async function updateProfile(req, res, next) {
  try {
    const { name, phone, area, avatar_preset, avatar_type } = req.body;
    const updatedUser = await authService.updateProfile(req.user.id, {
      name,
      phone,
      area,
      avatar_preset,
      avatar_type
    });

    return res.json({
      success: true,
      message: 'Profile updated successfully.',
      user: updatedUser
    });
  } catch (err) {
    next(err);
  }
}

async function uploadAvatar(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid image file.'
      });
    }

    const avatarUrl = `/uploads/${req.file.filename}`;
    const updatedUser = await authService.updateAvatar(req.user.id, avatarUrl);

    return res.json({
      success: true,
      message: 'Profile photo updated successfully.',
      avatar_url: avatarUrl,
      user: updatedUser
    });
  } catch (err) {
    next(err);
  }
}

async function removeAvatar(req, res, next) {
  try {
    const updatedUser = await authService.removeAvatar(req.user.id);

    return res.json({
      success: true,
      message: 'Custom photo removed successfully. Preset avatar restored.',
      user: updatedUser
    });
  } catch (err) {
    next(err);
  }
}

async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    const result = await authService.changePassword(req.user.id, { currentPassword, newPassword });

    return res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  uploadAvatar,
  removeAvatar,
  changePassword
};

