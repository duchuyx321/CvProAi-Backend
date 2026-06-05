export const SendOTPTemplate = (
    emails: string,
    fullname: string,
    code: string,
): Record<string, any> => ({
    to: emails,
    subject: `Your Code - ${code}`,
    text: `Chào ${fullname},

Mã của bạn là: ${code}. Hãy sử dụng mã này nếu bạn là người yêu cầu.

Nếu bạn không yêu cầu điều này, hãy bỏ qua tin nhắn này.

Trân trọng,
The CvProAi Team`,
});

export const SendResetPasswordTemplate = (
    emails: string,
    fullname: string,
    password: string,
): Record<string, any> => ({
    to: emails,
    subject: `Reset Passwrod CvProAi`,
    text: `Chào ${fullname},

Mật khẩu mới của bạn là: ${password}

Vui lòng sử dụng mật khẩu này để đăng nhập vào tài khoản và đổi lại mật khẩu mới sau khi đăng nhập.

Trân trọng,
The CvProAi Team`,
});
