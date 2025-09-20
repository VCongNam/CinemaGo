import bcrypt from "bcryptjs";
import User from "../models/user.js";
import { signAccessToken } from "../utils/jwt.js";

export const registerStaff = async (req, res, next) => {
  try {
    const { username, password, email, fullName } = req.body;

    // Validation dữ liệu đầu vào
    if (!username || !password || !email) {
      return res.status(400).json({ 
        message: "Username, password và email là bắt buộc" 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        message: "Mật khẩu phải có ít nhất 6 ký tự" 
      });
    }

    // Kiểm tra username và email đã tồn tại chưa
    const existingUser = await User.findOne({ 
      $or: [{ username }, { email }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        message: "Username hoặc email đã tồn tại" 
      });
    }

    // Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Tạo user mới
    await User.create({ 
      username, 
      password: hashedPassword, 
      email,
      full_name: fullName || '',
      role: "staff" 
    });
    
    res.status(201).json({ 
      message: "Tạo tài khoản nhân viên thành công" 
    });
  } catch (error) {
    next(error);
  }
};

export const loginStaff = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: "Tên đăng nhập hoặc mật khẩu không chính xác" });
    }
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: "Tên đăng nhập hoặc mật khẩu không chính xác" });
    }
    const accessToken = signAccessToken({ sub: user._id.toString(), role: user.role, username: user.username });
    const expiresIn = 3600; // seconds
    res.status(200).json({
      message: "Đăng nhập thành công",
      accessToken,
      expiresIn,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.full_name,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

export const registerCustomer = async (req, res, next) => {
  try {
    const { username, password, email, fullName } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ message: "Tên đăng nhập hoặc email đã tồn tại" });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({ 
      username, 
      password: hashedPassword, 
      email,
      full_name: fullName,
      role: "customer" 
    });
    res.status(201).json({ message: "Tạo tài khoản khách hàng thành công" });
  } catch (error) {
    next(error);
  }
};

export const loginCustomer = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: "Tên đăng nhập hoặc mật khẩu không chính xác" });
    }
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: "Tên đăng nhập hoặc mật khẩu không chính xác" });
    }
    const accessToken = signAccessToken({ sub: user._id.toString(), role: user.role, username: user.username });
    const expiresIn = 3600; // seconds
    res.status(200).json({
      message: "Đăng nhập thành công",
      accessToken,
      expiresIn,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.full_name,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id;

    // Validation dữ liệu đầu vào
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        message: "Mật khẩu hiện tại và mật khẩu mới là bắt buộc" 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        message: "Mật khẩu mới phải có ít nhất 6 ký tự" 
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({ 
        message: "Mật khẩu mới phải khác mật khẩu hiện tại" 
      });
    }

    // Lấy user từ database
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    // Kiểm tra mật khẩu hiện tại
    const isCurrentPasswordCorrect = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordCorrect) {
      return res.status(400).json({ message: "Mật khẩu hiện tại không chính xác" });
    }

    // Mã hóa mật khẩu mới
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    
    // Cập nhật mật khẩu
    user.password = hashedNewPassword;
    await user.save();

    res.status(200).json({ message: "Đổi mật khẩu thành công" });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    // Với JWT stateless, logout chỉ cần client xóa token
    // Nếu muốn blacklist token, cần lưu vào Redis hoặc database
    res.status(200).json({ message: "Đăng xuất thành công" });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { email, fullName, phone, address, dateOfBirth } = req.body;

    // Lấy user từ database
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    // Kiểm tra email có bị trùng với user khác không
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email, _id: { $ne: userId } });
      if (existingUser) {
        return res.status(400).json({ message: "Email đã được sử dụng bởi tài khoản khác" });
      }
    }

    // Cập nhật thông tin
    const updateData = {};
    if (email !== undefined) updateData.email = email;
    if (fullName !== undefined) updateData.full_name = fullName;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (dateOfBirth !== undefined) updateData.date_of_birth = dateOfBirth;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      message: "Cập nhật thông tin thành công",
      user: {
        id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        fullName: updatedUser.full_name,
        phone: updatedUser.phone,
        address: updatedUser.address,
        dateOfBirth: updatedUser.date_of_birth,
        role: updatedUser.role
      }
    });
  } catch (error) {
    next(error);
  }
};




 