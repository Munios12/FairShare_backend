import jwt from "jsonwebtoken";

export function createToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarColor: user.avatarColor,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}
