import bcrypt from "bcryptjs";
import User from "../models/user.js";
import { signAccessToken } from "../utils/jwt.js";
import { sendOTPEmail } from "../utils/email.js";
import { formatForAPI, getCurrentVietnamTime } from "../utils/timezone.js";

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
    
    // Kiểm tra trạng thái tài khoản
    if (user.status === "locked") {
      return res.status(403).json({ message: "Tài khoản đã bị khóa" });
    }
    
    if (user.status === "suspended") {
      return res.status(403).json({ message: "Tài khoản đã bị tạm khóa" });
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
        role: user.role,
        status: user.status
      },
      loginTime: getCurrentVietnamTime().toISOString()
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
    
    // Kiểm tra trạng thái tài khoản
    if (user.status === "locked") {
      return res.status(403).json({ message: "Tài khoản đã bị khóa" });
    }
    
    if (user.status === "suspended") {
      return res.status(403).json({ message: "Tài khoản đã bị tạm khóa" });
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
        role: user.role,
        status: user.status
      },
      loginTime: getCurrentVietnamTime().toISOString()
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

export const getUsers = async (req, res, next) => {
  try {
    const { page = 1, pageSize = 10, orderBy = 'created_at', orderDir = 'ASC', role = '', filterCriterias = [] } = req.body;

    // Validation
    const pageNum = parseInt(page);
    const limit = parseInt(pageSize);
    
    if (pageNum < 1) {
      return res.status(400).json({ message: "Page phải là số nguyên dương" });
    }
    
    if (limit < 1 || limit > 100) {
      return res.status(400).json({ message: "PageSize phải từ 1 đến 100" });
    }

    const skip = (pageNum - 1) * limit;

    // Build filter
    const filter = {};
    
    // Filter by role
    if (role && role.trim() !== '') {
      filter.role = role;
    }

    // Apply additional filterCriterias
    filterCriterias.forEach(criteria => {
      const { field, operator, value } = criteria;
      
      switch (operator) {
        case 'equals':
          filter[field] = value;
          break;
        case 'not_equals':
          filter[field] = { $ne: value };
          break;
        case 'contains':
          filter[field] = { $regex: value, $options: 'i' };
          break;
        case 'starts_with':
          filter[field] = { $regex: `^${value}`, $options: 'i' };
          break;
        case 'ends_with':
          filter[field] = { $regex: `${value}$`, $options: 'i' };
          break;
        case 'in':
          filter[field] = { $in: value };
          break;
        case 'not_in':
          filter[field] = { $nin: value };
          break;
        case 'greater_than':
          filter[field] = { $gt: value };
          break;
        case 'less_than':
          filter[field] = { $lt: value };
          break;
        case 'greater_equal':
          filter[field] = { $gte: value };
          break;
        case 'less_equal':
          filter[field] = { $lte: value };
          break;
      }
    });

    // Build sort
    const sort = {};
    const sortOrder = orderDir.toUpperCase() === 'DESC' ? -1 : 1;
    sort[orderBy] = sortOrder;

    // Query database
    const [users, totalCount] = await Promise.all([
      User.find(filter)
        .select('-password') // Exclude password
        .sort(sort)
        .skip(skip)
        .limit(limit),
      User.countDocuments(filter)
    ]);

    // Format response
    const formattedUsers = users.map(user => ({
      id: user._id,
      username: user.username,
      email: user.email,
      fullName: user.full_name,
      phone: user.phone,
      address: user.address,
      role: user.role,
      status: user.status,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    }));

    res.status(200).json({
      page: pageNum,
      pageSize: limit,
      totalCount,
      list: formattedUsers
    });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validation ID
    if (!id) {
      return res.status(400).json({ message: "ID người dùng là bắt buộc" });
    }

    // Kiểm tra ID có hợp lệ không
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "ID không hợp lệ" });
    }

    // Tìm user theo ID
    const user = await User.findById(id).select('-password');

    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    // Format response
    const formattedUser = {
      id: user._id,
      username: user.username,
      email: user.email,
      fullName: user.full_name,
      phone: user.phone,
      address: user.address,
      dateOfBirth: user.date_of_birth,
      role: user.role,
      status: user.status,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    };

    res.status(200).json({
      success: true,
      message: "Lấy thông tin người dùng thành công",
      data: formattedUser
    });
  } catch (error) {
    next(error);
  }
};


export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Validation dữ liệu đầu vào
    if (!email) {
      return res.status(400).json({ 
        message: "Email là bắt buộc" 
      });
    }

    // Kiểm tra format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        message: "Email không hợp lệ" 
      });
    }

    // Tìm user theo email
    const user = await User.findOne({ email });
    
    // Trả về thành công dù email không tồn tại (bảo mật)
    if (!user) {
      return res.status(200).json({ 
        message: "Nếu email tồn tại, bạn sẽ nhận được mã OTP" 
      });
    }

    // Kiểm tra rate limiting - chỉ cho phép 1 OTP mỗi 2 phút
    const now = new Date();
    if (user.otp_expires && user.otp_expires > now) {
      const remainingTime = Math.ceil((user.otp_expires - now) / 1000 / 60);
      return res.status(429).json({ 
        message: `Vui lòng đợi ${remainingTime} phút trước khi yêu cầu OTP mới` 
      });
    }

    // Tạo OTP 6 số
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Lưu OTP vào user với thời hạn 5 phút
    user.otp_code = otp;
    user.otp_expires = new Date(now.getTime() + 5 * 60 * 1000); // 5 phút
    user.otp_attempts = 0;
    await user.save();

    // Gửi email OTP
    try {
      await sendOTPEmail(email, otp);
      
      res.status(200).json({ 
        message: "Mã OTP đã được gửi đến email của bạn",
        expiresIn: 5 // phút
      });
    } catch (emailError) {
      // Nếu gửi email thất bại, xóa OTP
      user.otp_code = undefined;
      user.otp_expires = undefined;
      await user.save();
      
      console.error('Email sending failed:', emailError);
      return res.status(500).json({ 
        message: "Không thể gửi email OTP. Vui lòng thử lại sau" 
      });
    }
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;

    // Validation dữ liệu đầu vào
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ 
        message: "Email, OTP và mật khẩu mới là bắt buộc" 
      });
    }

    // Kiểm tra format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        message: "Email không hợp lệ" 
      });
    }

    // Kiểm tra độ mạnh mật khẩu
    if (newPassword.length < 6) {
      return res.status(400).json({ 
        message: "Mật khẩu phải có ít nhất 6 ký tự" 
      });
    }

    // Tìm user theo email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy tài khoản" });
    }

    // Kiểm tra OTP có tồn tại không
    if (!user.otp_code) {
      return res.status(400).json({ 
        message: "Không có mã OTP nào được tạo. Vui lòng yêu cầu OTP mới" 
      });
    }

    // Kiểm tra OTP có hết hạn không
    const now = new Date();
    if (!user.otp_expires || user.otp_expires < now) {
      // Xóa OTP hết hạn
      user.otp_code = undefined;
      user.otp_expires = undefined;
      user.otp_attempts = 0;
      await user.save();
      
      return res.status(400).json({ 
        message: "Mã OTP đã hết hạn. Vui lòng yêu cầu OTP mới" 
      });
    }

    // Kiểm tra số lần nhập sai
    if (user.otp_attempts >= 3) {
      // Xóa OTP sau 3 lần nhập sai
      user.otp_code = undefined;
      user.otp_expires = undefined;
      user.otp_attempts = 0;
      await user.save();
      
      return res.status(400).json({ 
        message: "Bạn đã nhập sai quá 3 lần. Vui lòng yêu cầu OTP mới" 
      });
    }

    // Kiểm tra OTP có chính xác không
    if (user.otp_code !== otp) {
      // Tăng số lần nhập sai
      user.otp_attempts += 1;
      await user.save();
      
      const remainingAttempts = 3 - user.otp_attempts;
      return res.status(400).json({ 
        message: `Mã OTP không chính xác. Bạn còn ${remainingAttempts} lần thử` 
      });
    }

    // Kiểm tra mật khẩu mới có khác mật khẩu cũ không
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({ 
        message: "Mật khẩu mới phải khác mật khẩu hiện tại" 
      });
    }

    // Cập nhật mật khẩu mới
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    
    // Xóa OTP sau khi sử dụng thành công
    user.otp_code = undefined;
    user.otp_expires = undefined;
    user.otp_attempts = 0;
    
    await user.save();

    res.status(200).json({ 
      message: "Đặt lại mật khẩu thành công. Bạn có thể đăng nhập với mật khẩu mới" 
    });
  } catch (error) {
    next(error);
  }
};

// API thay đổi trạng thái tài khoản người dùng (chỉ admin)
export const updateUserStatus = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;
    const adminId = req.user._id;

    // Validation
    if (!userId) {
      return res.status(400).json({ 
        message: "ID người dùng là bắt buộc" 
      });
    }

    if (!status) {
      return res.status(400).json({ 
        message: "Trạng thái là bắt buộc" 
      });
    }

    // Kiểm tra ID có hợp lệ không
    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        message: "ID người dùng không hợp lệ" 
      });
    }

    // Kiểm tra trạng thái có hợp lệ không
    const validStatuses = ["active", "locked", "suspended"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        message: `Trạng thái không hợp lệ. Các trạng thái cho phép: ${validStatuses.join(", ")}` 
      });
    }

    // Tìm user cần thay đổi trạng thái
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ 
        message: "Không tìm thấy người dùng" 
      });
    }

    // Không cho phép admin thay đổi trạng thái của chính mình
    if (targetUser._id.toString() === adminId.toString()) {
      return res.status(400).json({ 
        message: "Không thể thay đổi trạng thái tài khoản của chính mình" 
      });
    }

    // Không cho phép thay đổi trạng thái admin khác
    if (targetUser.role === "admin") {
      return res.status(403).json({ 
        message: "Không thể thay đổi trạng thái tài khoản admin khác" 
      });
    }

    // Kiểm tra trạng thái hiện tại
    if (targetUser.status === status) {
      const statusMessages = {
        active: "hoạt động",
        locked: "bị khóa",
        suspended: "bị tạm khóa"
      };
      
      return res.status(200).json({ 
        message: `Tài khoản đã ở trạng thái ${statusMessages[status]}`,
        data: {
          id: targetUser._id,
          username: targetUser.username,
          email: targetUser.email,
          status: targetUser.status
        }
      });
    }

    // Cập nhật trạng thái
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { status },
      { new: true, runValidators: true }
    ).select('-password');

    // Tạo thông báo phù hợp
    const statusMessages = {
      active: "Mở khóa tài khoản thành công",
      locked: "Khóa tài khoản thành công", 
      suspended: "Tạm khóa tài khoản thành công"
    };

    const actionMessages = {
      active: "unlockedAt",
      locked: "lockedAt",
      suspended: "suspendedAt"
    };

    const currentTime = getCurrentVietnamTime();
    const responseData = {
      id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      fullName: updatedUser.full_name,
      role: updatedUser.role,
      status: updatedUser.status,
      [actionMessages[status]]: currentTime.toISOString()
    };

    res.status(200).json({
      message: statusMessages[status],
      data: responseData
    });
  } catch (error) {
    next(error);
  }
};




 