use("cinema");
db.createCollection("counters");

db.createCollection("movie_genres");
db.movie_genres.insertMany([
  {
    code: "TLP01",
    name: "Kinh dị",
    deleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    movieGenreId: 1,
    __v: 0,
  },
  {
    code: "TLP02",
    name: "Hài",
    deleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    movieGenreId: 2,
    __v: 0,
  },
  {
    code: "TLP03",
    name: "Hành động",
    deleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    movieGenreId: 3,
    __v: 0,
  },
  {
    code: "TLP04",
    name: "Viễn tưởng",
    deleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    movieGenreId: 4,
    __v: 0,
  },
]);

db.createCollection("movies");
db.movies.insertMany([
  {
    _id: "66ee9c28a4a908b4f825690d",
    code: "PHIM01",
    movieGenreCode: ["TLP01"],
    name: "CÁM",
    image:
      "https://starlight.vn/Areas/Admin/Content/Fileuploads/images/POSTER/cam-20_9.jpg",
    duration: 120,
    ageRestriction: 16,
    description: "Dị bản kinh dị từ câu chuyện cổ tích Tấm Cám",
    trailer: "http://example.com/trailer.mp4",
    director: "Trần Hữu Tấn",
    cast: "Quốc Cường, Thúy Diễm, Rima Thanh Vy, Lâm Thanh Mỹ, Hải Nam",
    country: "Việt Nam",
    startDate: "2024-09-01T00:00:00.000Z",
    endDate: "2024-12-01T00:00:00.000Z",
    status: 0,
    deleted: false,
    startDate: ISODate("2024-09-10"),
    endDate: ISODate("1990-10-24"),
    movieId: 1,
    __v: 0,
  },
  {
    _id: "66ee9d0ca4a908b4f825691b",
    code: "PHIM02",
    movieGenreCode: ["TLP01"],
    name: "KHÔNG NÓI ĐIỀU DỮ",
    image:
      "https://starlight.vn/Areas/Admin/Content/Fileuploads/images/POSTER/khong-noi-dieu-du.jpg",
    duration: 110,
    ageRestriction: 18,
    description:
      "Một gia đình người Mỹ được mời đến nghỉ cuối tuần tại khu đất nông thôn bình dị của một gia đình người Anh thiện lành mà họ kết bạn trong kỳ nghỉ, câu chuyện bắt đầu khi kỳ nghỉ trong này mơ sớm biến thành một cơn ác mộng tâm lý kinh hoàng.",
    trailer: "http://example.com/trailer.mp4",
    director: "James Watkins",
    cast: "James McAvoy, Mackenzie Davis, Scoot McNairy,...",
    country: "Mỹ",
    startDate: ISODate("2024-09-10"),
    endDate: ISODate("1990-10-24"),
    status: 0,
    deleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    movieId: 2,
    __v: 0,
  },
]);

const movieGenreValue =
  db.movie_genres.find().sort({ movieGenreId: -1 }).limit(1).next()
    ?.movieGenreId || 0;
const movieValue =
  db.movies.find().sort({ movieId: -1 }).limit(1).next()?.movieId || 0;

db.counters.updateOne(
  { id: "movieGenreId" },
  { $set: { seq: movieGenreValue } },
  { upsert: true }
);

db.counters.updateOne(
  { id: "movieId" },
  { $set: { seq: movieValue } },
  { upsert: true }
);
