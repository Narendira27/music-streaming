import bcrypt from "bcrypt";

const hashPassword = (password: string) => {
  return bcrypt.hashSync(password, 10);
};

const compareHash = (hash: string, pass: string) => {
  return bcrypt.compareSync(pass, hash);
};

export { hashPassword, compareHash };
