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
  {
    code: "TLP05",
    name: "Hoạt hình",
    deleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    movieGenreId: 5,
    __v: 0,
  },
  {
    code: "TLP06",
    name: "Tình cảm",
    deleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    movieGenreId: 6,
    __v: 0,
  },
]);

db.createCollection("movies");
db.movies.insertMany([
  {
    code: "PHIM01",
    movieGenreCode: ["TLP01"],
    name: "CÁM",
    image:
      "https://starlight.vn/Areas/Admin/Content/Fileuploads/images/POSTER/cam-20_9.jpg",
    duration: 120,
    ageRestriction: 16,
    description: "Dị bản kinh dị từ câu chuyện cổ tích Tấm Cám",
    trailer: "https://www.youtube.com/watch?v=_8qUFEmPQbc",
    director: "Trần Hữu Tấn",
    cast: "Quốc Cường, Thúy Diễm, Rima Thanh Vy, Lâm Thanh Mỹ, Hải Nam",
    country: "Việt Nam",
    startDate: ISODate("2024-09-10"),
    endDate: ISODate("2024-10-24"),
    status: 0,
    deleted: false,

    movieId: 1,
    __v: 0,
  },
  {
    code: "PHIM02",
    movieGenreCode: ["TLP01"],
    name: "KHÔNG NÓI ĐIỀU DỮ",
    image:
      "https://starlight.vn/Areas/Admin/Content/Fileuploads/images/POSTER/khong-noi-dieu-du.jpg",
    duration: 110,
    ageRestriction: 18,
    description:
      "Một gia đình người Mỹ được mời đến nghỉ cuối tuần tại khu đất nông thôn bình dị của một gia đình người Anh thiện lành mà họ kết bạn trong kỳ nghỉ, câu chuyện bắt đầu khi kỳ nghỉ trong này mơ sớm biến thành một cơn ác mộng tâm lý kinh hoàng.",
    trailer: "https://www.youtube.com/watch?v=o2SnQCzoy8Q",
    director: "James Watkins",
    cast: "James McAvoy, Mackenzie Davis, Scoot McNairy,...",
    country: "Mỹ",
    startDate: ISODate("2024-09-10"),
    endDate: ISODate("2024-10-24"),
    status: 0,
    deleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    movieId: 2,
    __v: 0,
  },
  {
    code: "PHIM03",
    movieGenreCode: ["TLP02"],
    name: "LÀM GIÀU VỚI MA",
    image:
      "https://i.pinimg.com/736x/8d/de/d7/8dded765f3d2bfdb07b672e6fb634b93.jpg",
    duration: 110,
    ageRestriction: 16,
    description:
      "Lanh (Tuấn Trần) - con trai của ông Đạo làm nghề mai táng (Hoài Linh), lâm vào đường cùng vì cờ bạc. Trong cơn túng quẫn, “duyên tình” đẩy đưa anh gặp một ma nữ (Diệp Bảo Ngọc) và cùng nhau thực hiện những 'kèo thơm' để phục vụ mục đích của cả hai.",
    trailer: "https://www.youtube.com/watch?v=MtZ_hf7tLxk",
    director: "Nguyễn Nhật Trung",
    cast: "Hoài Linh, Tuấn Trần, Diệp Bảo Ngọc, Lê Giang...",
    country: "Việt Nam",
    startDate: ISODate("2024-09-10"),
    endDate: ISODate("2024-10-24"),
    status: 0,
    deleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    movieId: 3,
    __v: 0,
  },
  {
    code: "PHIM04",
    movieGenreCode: ["TLP01"],
    name: "THE CROW: BÁO THÙ",
    image:
      "https://starlight.vn/Areas/Admin/Content/Fileuploads/images/POSTER/crown.jpg",
    duration: 110,
    ageRestriction: 18,
    description:
      "Sau khi Eric cùng vị hôn thê Shelly bị sát hại dã man, anh được trao cơ hội để trở lại trần thế. Eric bắt đầu bước vào con đường báo thù những kẻ đã hủy hoại cuộc đời anh và người mình yêu.",
    trailer: "https://www.youtube.com/watch?v=B_chCyJClAw",
    director: "Rupert Sanders",
    cast: "Bill Skarsgård, FKA Twigs, Danny Huston",
    country: "Mỹ",
    startDate: ISODate("2024-09-10"),
    endDate: ISODate("2024-10-24"),
    status: 0,
    deleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    movieId: 4,
    __v: 0,
  },

  {
    code: "PHIM05",
    movieGenreCode: ["TLP01", "TLP02"],
    name: "TÌM KIẾM TÀI NĂNG ÂM PHỦ",
    image:
      "https://starlight.vn/Areas/Admin/Content/Fileuploads/images/POSTER/tim-kiem-tai-nang-am-phu.jpg",
    duration: 110,
    ageRestriction: 18,
    description:
      "Sinh ra là một con người đã đủ khó khăn, nhưng hóa ra trở thành một hồn ma cũng không hề dễ dàng. Newbie - một hồn ma mới, kinh hoàng nhận ra rằng cô chỉ còn 28 ngày nữa cho đến khi linh hồn của cô biến mất khỏi thế giới. Makoto, một “chuyên viên ám quẻ” tiếp cận Newbie với lời đề nghị kết hợp cùng ngôi sao ma Catherine để dựng lại câu chuyện kinh dị huyền thoại về khách sạn Wang Lai. Nếu câu chuyện đủ sức hù dọa người sống thì cái tên của cô sẽ trở thành huyền thoại và linh hồn của Newbie sẽ tiếp tục được sống dưới địa ngục mà không bị tan biến vĩnh viễn.",
    trailer: "https://www.youtube.com/watch?v=p017Mo6krsU",
    director: "John Hsu",
    cast: "CHEN Bo-Lin, Sandrine PINNA, Gingle WANG",
    country: "Hàn Quốc",
    startDate: ISODate("2024-09-10"),
    endDate: ISODate("2024-10-24"),
    status: 0,
    deleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    movieId: 5,
    __v: 0,
  },
  {
    code: "PHIM06",
    movieGenreCode: ["TLP03"],
    name: "LẬT MẶT 6: TẤM VÉ ĐỊNH MỆNH",
    image:
      "https://upload.wikimedia.org/wikipedia/vi/b/bc/L%E1%BA%ADt_m%E1%BA%B7t_6_poster.jpg?20240225105257",
    duration: 130,
    ageRestriction: 16,
    description:
      "Sáu người bạn vớ bở khi tờ vé số mua chung mang về cho họ hàng tỷ đồng, nhưng một cái chết trong nhóm khơi mào loạt hành động vì lòng tham có thể hủy hoại mọi chuyện.",
    trailer: "https://www.youtube.com/watch?v=AO0_r-OHxJU",
    director: "Lý Hải",
    cast: "Quốc Cường, Trung Dũng, Huy Khánh",
    country: "Việt Nam",
    startDate: ISODate("2024-09-10"),
    endDate: ISODate("2024-10-24"),
    status: 0,
    deleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    movieId: 6,
    __v: 0,
  },
  {
    code: "PHIM07",
    movieGenreCode: ["TLP05", "TLP06"],
    name: "PHIM ĐIỆN ẢNH THÁM TỬ LỪNG DANH CONAN: NGÔI SAO 5 CÁNH 1 TRIỆU ĐÔ",
    image:
      "https://upload.wikimedia.org/wikipedia/vi/3/38/DetectiveConanMovie27.jpeg",
    duration: 110,
    ageRestriction: 13,
    description:
      "Trong khi đến Hakodate tham gia một giải kiếm đạo, Conan và Heiji đụng độ siêu trộm Kaito Kid - khi hắn đang nhắm tới một thanh kiếm Nhật được cất giấu trong nhà kho của một gia đình tài phiệt. Thi thể một tay buôn vũ khí khét tiếng được phát hiện với vết chém hình chữ thập, và trùng hợp thay, 'kho báu' mà gã truy lùng dường như cũng có liên quan mật thiết đến thanh kiếm cổ mà Kid đang nhắm tới.",
    trailer: "https://www.youtube.com/watch?v=AO0_r-OHxJU",
    director: "Chika Nagaoka",
    cast: "Rikiya Koyama, Minami Takayama, Kenjirô Tsuda, Wakana Yamazaki",
    country: "Nhật Bản",
    startDate: ISODate("2024-09-10"),
    endDate: ISODate("2024-10-24"),
    status: 0,
    deleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    movieId: 7,
    __v: 0,
  },
]);
db.createCollection("hierarchy_structures");

db.hierarchy_structures.insertMany([
  {
    code: "PHANCAP01",
    name: "Phân cấp vị trí địa lý",
    deleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    hierarchyStructureId: 1,
    __v: 0,
  },
  {
    code: "PHANCAP02",
    name: "Phân cấp khách hàng",
    deleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    hierarchyStructureId: 2,
    __v: 0,
  },
]);

db.createCollection("hierarchy_values");

db.hierarchy_values.insertMany([
  {
    code: "HCM",
    name: "Hồ Chí Minh",
    parentCode: null,
    level: 0,
    hierarchyStructureCode: "PHANCAP01",
    deleted: false,
    createdAt: {
      $date: "2024-09-23T14:30:41.148Z",
    },
    updatedAt: {
      $date: "2024-09-23T14:30:41.148Z",
    },
    hierarchyValueId: 1,
    __v: 0,
  },
  {
    code: "HCM_Q12",
    name: "Quận 12",
    parentCode: "HCM",
    level: 1,
    hierarchyStructureCode: "PHANCAP01",
    deleted: false,
    createdAt: {
      $date: "2024-09-23T14:30:55.346Z",
    },
    updatedAt: {
      $date: "2024-09-23T14:30:55.346Z",
    },
    hierarchyValueId: 2,
    __v: 0,
  },
  {
    code: "HCM_Q12_PTX",
    name: "Phường Thạnh Xuân",
    parentCode: "HCM_Q12",
    level: 2,
    hierarchyStructureCode: "PHANCAP01",
    deleted: false,
    createdAt: {
      $date: "2024-09-23T14:31:09.847Z",
    },
    updatedAt: {
      $date: "2024-09-23T14:31:09.847Z",
    },
    hierarchyValueId: 3,
    __v: 0,
  },
  {
    code: "HCM_Q12_PTX_5DTX13",
    name: "5 Đường Thạnh Xuân 13",
    parentCode: "HCM_Q12_PTX",
    level: 3,
    hierarchyStructureCode: "PHANCAP01",
    deleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    hierarchyValueId: 4,
    __v: 0,
  },

  {
    code: "HCM_Q12_PTX_97DTX24",
    name: "97 Đường Thạnh Xuân 24",
    parentCode: "HCM_Q12_PTX",
    level: 3,
    hierarchyStructureCode: "PHANCAP01",
    deleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    hierarchyValueId: 5,
    __v: 0,
  },
]);

db.createCollection("cinemas");
db.cinemas.insertMany([
  {
    code: "RAP01",
    name: "Rạp Thạnh Xuân 13",
    hierarchyValueCode: "HCM_Q12_PTX_5DTX13",
    status: 0,
    deleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    cinemaId: 1,
    __v: 0,
  },

  {
    code: "RAP02",
    name: "Rạp Thạnh Xuân 13",
    hierarchyValueCode: "HCM_Q12_PTX_97DTX24",
    status: 0,
    deleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    cinemaId: 2,
    __v: 0,
  },
]);

db.createCollection("products");

db.products.insertMany([
  {
    code: "SP01",
    name: "Coca",
    description: "Nước ngọt",
    image:
      "https://thegioidouong.net/wp-content/uploads/2021/06/coca-300ml-chai-nhua-300x300.jpg",
    type: 1,
    _id: "66f4e5218e68509cfe6046f5",
    deleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    status: 0,
    productId: 1,
    __v: 0,
  },
]);

const movieGenreMax =
  db.movie_genres.find().sort({ movieGenreId: -1 }).limit(1).next()
    ?.movieGenreId || 0;
const movieMax =
  db.movies.find().sort({ movieId: -1 }).limit(1).next()?.movieId || 0;

const hierarchyStructuresMax =
  db.hierarchy_structures
    .find()
    .sort({ hierarchyStructureId: -1 })
    .limit(1)
    .next()?.hierarchyStructureId || 0;
const hierarchyValueMax =
  db.hierarchy_structures.find().sort({ hierarchyValueId: -1 }).limit(1).next()
    ?.hierarchyValueId || 0;

const cinemaMax =
  db.cinemas.find().sort({ cinemaId: -1 }).limit(1).next()?.cinemaId || 0;

const productMax =
  db.products.find().sort({ productId: -1 }).limit(1).next()?.productId || 0;

db.counters.updateOne(
  { id: "movieGenreId" },
  { $set: { seq: movieGenreMax } },
  { upsert: true }
);

db.counters.updateOne(
  { id: "movieId" },
  { $set: { seq: movieMax } },
  { upsert: true }
);

db.counters.updateOne(
  { id: "hierarchyStructureId" },
  { $set: { seq: hierarchyStructuresMax } },
  { upsert: true }
);

db.counters.updateOne(
  { id: "hierarchyValueId" },
  { $set: { seq: hierarchyStructuresMax } },
  { upsert: true }
);
db.counters.updateOne(
  { id: "cinemaId" },
  { $set: { seq: cinemaMax } },
  { upsert: true }
);
db.counters.updateOne(
  { id: "productId" },
  { $set: { seq: productMax } },
  { upsert: true }
);
