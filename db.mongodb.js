use("movie");

db.createCollection("users");
db.users.insertMany([
  {
    dateofbirth: ISODate("1990-01-01"),
    gender: "male",
    name: "Nguyễn Nhất An",
    password: "$2b$10$vbUKrFNutR00mYVq3M.2kOS5VTC0rZBdtsyEWAHJSmcydxiAi5L4m",
  },
]);
