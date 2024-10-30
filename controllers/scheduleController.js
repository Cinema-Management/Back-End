const Schedule = require("../models/Schedule");
const Movie = require("../models/Movie");
const Room = require("../models/Room");
const Subtitle = require("../models/Subtitle");
const Audio = require("../models/Audio");
const Product = require("../models/Product");
const RoomType = require("../models/RoomType");
const SeatStatusInSchedule = require("../models/SeatStatusInSchedule");
const Cinema = require("../models/Cinema");

const scheduleController = {
  add: async (req, res) => {
    try {
      const {
        movieCode,
        roomCode,
        screeningFormatCode,
        subtitleCode,
        audioCode,
        date,
        startTime,
      } = req.body;

      // Kiểm tra đầu vào
      if (!movieCode || !roomCode || !date || !startTime) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Kiểm tra xem movie và room có tồn tại không
      const movie = await Movie.findOne({ code: movieCode });
      if (!movie) {
        return res.status(400).json({ message: "Movie not found" });
      }
      const duration = movie.duration;

      const room = await Room.findOne({ code: roomCode });
      if (!room) {
        return res.status(400).json({ message: "Room not found" });
      }

      const subtitle = await Subtitle.findOne({ code: subtitleCode });
      if (!subtitle) {
        return res.status(400).json({ message: "Subtitle not found" });
      }

      const audio = await Audio.findOne({ code: audioCode });
      if (!audio) {
        return res.status(400).json({ message: "Audio not found" });
      }

      const roomType = await RoomType.findOne({ code: screeningFormatCode });
      if (!roomType) {
        return res
          .status(400)
          .json({ message: "screeningFormatCode not found" });
      }

      // Kiểm tra thời gian bắt đầu và kết thúc có hợp lệ không
      const start = new Date(startTime);
      const cleaningTime = 15 * 60000; // 15 phút dọn dẹp tính bằng milliseconds

      const end = new Date(start.getTime() + duration * 60000 + cleaningTime);

      // if (start >= end) {
      //   return res
      //     .status(400)
      //     .json({ message: "Start time must be before end time" });
      // }

      // // Kiểm tra xem có lịch chiếu nào cùng phòng và thời gian bị trùng không
      // const conflictingSchedules = await Schedule.find({
      //   roomCode,
      //   date,
      //   $or: [{ startTime: { $lt: end }, endTime: { $gt: start } }],
      // });

      // if (conflictingSchedules.length > 0) {
      //   return res.status(400).json({
      //     message: "Schedule conflicts with an existing schedule in this room",
      //   });
      // }

      // // Lấy mã rạp từ room
      // const cinemaCode = room.cinemaCode;

      // // Kiểm tra xem có lịch chiếu của cùng 1 bộ phim trong cùng 1 rạp không
      // const conflictingMovieSchedules = await Schedule.find({
      //   movieCode,
      //   date,
      //   roomCode: { $ne: roomCode }, // Phòng khác trong cùng rạp
      //   startTime: start, // trùng thời gian
      // }).populate({
      //   path: "roomCode",
      //   match: { cinemaCode }, // Chỉ kiểm tra trong cùng rạp
      //   model: "Room",
      //   foreignField: "code",
      // });

      // if (conflictingMovieSchedules.length > 0) {
      //   return res.status(400).json({
      //     message:
      //       "This movie is already scheduled at the same time in another room in this cinema",
      //   });
      // }

      // Tạo mã lịch chiếu mới

      const lastPriceArray = await Schedule.findWithDeleted()
        .sort({ scheduleId: -1 })
        .limit(1)
        .lean();
      const lastPrice = lastPriceArray[0];
      let newCode = "SC01";
      if (lastPrice && lastPrice.code) {
        const lastCodeNumber = parseInt(lastPrice.code.substring(2));

        const nextCodeNumber = lastCodeNumber + 1;

        newCode =
          nextCodeNumber < 10 ? `SC0${nextCodeNumber}` : `SC${nextCodeNumber}`;
      }

      let targetDate = new Date(date);

      // Lùi 7 giờ để chuyển từ giờ Việt Nam về UTC (tránh dùng Date.UTC vì dữ liệu đã lưu dưới dạng UTC)
      const vietnamTimezoneOffset = -7 * 60; // Phút (-7 giờ)
      targetDate = new Date(
        targetDate.getTime() + vietnamTimezoneOffset * 60 * 1000
      );

      // Tạo mới lịch chiếu
      const newSchedule = new Schedule({
        code: newCode,
        movieCode,
        roomCode,
        screeningFormatCode,
        subtitleCode,
        audioCode,
        date: targetDate,
        startTime: start,
        endTime: end,
      });

      await newSchedule.save();

      return res.status(201).json(newSchedule);
    } catch (error) {
      console.error("Error creating schedule:", error);
      return res.status(500).json({ message: "Internal server error", error });
    }
  },
  getAll: async (req, res) => {
    try {
      const { date } = req.body; // Lấy ngày từ body
      let schedules;

      if (date) {
        // Tạo điều kiện lọc theo ngày
        const startOfDay = new Date(date);
        const endOfDay = new Date(date);
        endOfDay.setDate(endOfDay.getDate() + 1); // Thêm 1 ngày để lọc đến cuối ngày

        // Tìm lịch chiếu theo ngày
        schedules = await Schedule.find({
          startTime: { $gte: startOfDay, $lt: endOfDay }, // Giả sử bạn có trường startTime để lưu thời gian bắt đầu
        });
      } else {
        // Nếu không có ngày, trả về tất cả lịch chiếu
        schedules = await Schedule.find();
      }

      return res.json(schedules);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },
  getAllRoomsWithSchedules: async (req, res) => {
    try {
      const { cinemaCode } = req.params;
      const { date } = req.query;

      let targetDate = new Date(date);

      // Lùi 7 giờ để chuyển từ giờ Việt Nam về UTC (tránh dùng Date.UTC vì dữ liệu đã lưu dưới dạng UTC)
      const vietnamTimezoneOffset = -7 * 60; // Phút (-7 giờ)
      targetDate = new Date(
        targetDate.getTime() + vietnamTimezoneOffset * 60 * 1000
      );

      const rooms = await Room.find({ cinemaCode })
        .populate({
          path: "roomTypeCode", // Trường chứa mã loại phòng
          model: "RoomType", // Mô hình RoomType
          select: "code name -_id", // Chỉ lấy trường code và name, loại bỏ _id
          foreignField: "code",
        })
        .populate({
          path: "cinemaCode",
          model: "Cinema",
          select: "code name -_id",
          foreignField: "code",
        })
        .populate({
          path: "roomSizeCode", // Trường chứa mã loại phòng
          model: "RoomSize", // Mô hình RoomType
          select: "code name -_id", // Chỉ lấy trường code và name, loại bỏ _id
          foreignField: "code",
        });

      if (rooms.length === 0) {
        return res.status(200).send(rooms);
      }

      // Lặp qua từng phòng và lấy lịch chiếu tương ứng
      const roomsWithSchedules = await Promise.all(
        rooms.map(async (room) => {
          const schedules = await Schedule.find({
            roomCode: room.code,
            date: targetDate,
          })
            .populate({
              path: "movieCode",
              model: "Movie",
              select:
                "code name image duration ageRestriction movieGenreCode -_id",
              populate: {
                path: "movieGenreCode",
                model: "MovieGenre",
                select: "code name -_id",
                foreignField: "code",
              },
              foreignField: "code",
            })
            .populate({
              path: "screeningFormatCode",
              model: "RoomType",
              select: "code name -_id",
              foreignField: "code",
            })
            .populate({
              path: "audioCode",
              model: "Audio",
              select: "code name -_id",
              foreignField: "code",
            })
            .populate({
              path: "roomCode",
              model: "Room",
              // select: "code name -_id",
              foreignField: "code",
            })
            .populate({
              path: "subtitleCode",
              model: "Subtitle",
              select: "code name -_id",
              foreignField: "code",
            });
          const totalSeats = await Product.countDocuments({
            roomCode: room.code, // Mã phòng
            type: 0, // Loại ghế
          });

          return {
            ...room.toObject(),
            roomTypeName: room.roomTypeCode.map((type) => type.name).join(", "), // Lấy tên loại phòng
            roomSizeName: room.roomSizeCode ? room.roomSizeCode.name : null,
            totalSeats, // Tổng số ghế của phòng
            schedules: schedules, // Thêm danh sách lịch chiếu vào từng phòng
          };
        })
      );

      return res.status(200).json(roomsWithSchedules);
    } catch (error) {
      console.error("Error getting rooms with schedules:", error);
      return res.status(500).json({ message: "Internal server error", error });
    }
  },

  update: async (req, res) => {
    try {
      const { code } = req.params;
      const {
        movieCode,
        screeningFormatCode,
        subtitleCode,
        audioCode,
        startTime,
        status,
      } = req.body;

      // Tìm lịch chiếu theo code
      const schedule = await Schedule.findOne({ code: code });
      // if (!schedule) {
      //   return res.status(404).json({ message: "Schedule not found" });
      // }

      // Cập nhật các trường có thay đổi
      if (movieCode) schedule.movieCode = movieCode;
      if (screeningFormatCode)
        schedule.screeningFormatCode = screeningFormatCode;
      if (subtitleCode) schedule.subtitleCode = subtitleCode;
      if (audioCode) schedule.audioCode = audioCode;

      // Cập nhật startTime và tính toán endTime
      if (startTime) {
        const start = new Date(startTime);

        // Lấy thời lượng phim từ movieCode mới (nếu có)
        const movie = await Movie.findOne({
          code: movieCode,
        });
        if (!movie) {
          return res.status(400).json({ message: "Movie not found" });
        }
        const duration = movie.duration;

        // Tính toán thời gian kết thúc dựa trên startTime và thời lượng phim
        const cleaningTime = 15 * 60000; // 15 phút dọn dẹp
        const end = new Date(start.getTime() + duration * 60000 + cleaningTime);

        // Kiểm tra xung đột lịch chiếu trong cùng phòng (vì roomCode đã có sẵn trong schedule)
        const conflictingSchedules = await Schedule.find({
          roomCode: schedule.roomCode,
          date: schedule.date,
          $or: [{ startTime: { $lt: end }, endTime: { $gt: start } }],
          code: { $ne: code }, // Loại trừ chính lịch chiếu hiện tại
        });

        if (conflictingSchedules.length > 0) {
          return res.status(400).json({
            message:
              "Schedule conflicts with an existing schedule in this room",
          });
        }

        // Kiểm tra xung đột lịch chiếu của cùng phim trong các phòng khác của cùng rạp
        const room = await Room.findOne({ code: schedule.roomCode });
        if (!room) {
          return res.status(400).json({ message: "Room not found" });
        }
        const cinemaCode = room.cinemaCode;

        const conflictingMovieSchedules = await Schedule.find({
          movieCode: schedule.movieCode,
          date: schedule.date,
          roomCode: { $ne: schedule.roomCode },
          startTime: start,
        }).populate({
          path: "roomCode",
          match: { cinemaCode },
          model: "Room",
          foreignField: "code",
        });

        if (conflictingMovieSchedules.length > 0) {
          return res.status(400).json({
            message:
              "This movie is already scheduled at the same time in another room in this cinema",
          });
        }

        // Cập nhật thời gian bắt đầu và kết thúc
        schedule.startTime = startTime;
        schedule.endTime = end.toISOString();
      }

      // Cập nhật status nếu có
      if (status !== undefined) schedule.status = status;

      // Lưu lịch chiếu đã cập nhật
      await schedule.save();

      return res.status(200).json(schedule);
    } catch (error) {
      console.error("Error updating schedule:", error);
      return res.status(500).json({ message: "Internal server error", error });
    }
  },

  updateStatus: async (req, res) => {
    const { code } = req.params; // Lấy code từ params

    try {
      // Tìm lịch chiếu theo code
      const schedule = await Schedule.findOne({ code: code });

      // Nếu không tìm thấy schedule theo code
      if (!schedule) {
        return res.status(404).json({ message: "Schedule not found" });
      }

      // Lấy thông tin phim dựa trên movieCode trong schedule
      const movie = await Movie.findOne({ code: schedule.movieCode });

      // Nếu không tìm thấy phim
      if (!movie) {
        return res.status(404).json({ message: "Movie not found" });
      }

      // So sánh ngày chiếu với ngày phát hành
      const screeningDate = new Date(schedule.date);
      const releaseDate = new Date(movie.startDate); // Giả định ngày phát hành là trường 'releaseDate' trong movie

      // Cập nhật status dựa trên điều kiện
      if (screeningDate < releaseDate) {
        schedule.status = 2; // Ngày chiếu trước ngày phát hành
      } else {
        schedule.status = 1; // Ngày chiếu hợp lệ
      }

      // Lưu lịch chiếu đã cập nhật
      await schedule.save();

      // Trả về phản hồi thành công
      return res.status(200).json({
        message: "Status updated successfully",
        updatedSchedule: schedule,
      });
    } catch (error) {
      // Xử lý lỗi nếu có
      return res.status(500).json({
        message: "An error occurred while updating the status",
        error: error.message,
      });
    }
  },

  checkRoomHasSchedules: async (req, res) => {
    try {
      const { roomCode } = req.params; // Lấy mã phòng từ params

      // Lấy ngày hiện tại
      const currentDate = new Date().toISOString().split("T")[0]; // Format ngày dưới dạng YYYY-MM-DD

      // Tìm lịch chiếu cho phòng theo mã và ngày hiện tại
      const schedules = await Schedule.find({
        roomCode: roomCode,
        date: { $gte: currentDate }, // So sánh với ngày hiện tại
      });

      // Nếu không có lịch chiếu, trả về phản hồi không có lịch chiếu
      if (schedules.length === 0) {
        return res.status(200).json({
          hasSchedules: false,
          message: "No schedules found for this room today.",
        });
      }

      // Nếu có lịch chiếu, trả về phản hồi có lịch chiếu
      return res.status(200).json({
        hasSchedules: true,
        message: "Schedules found for this room today.",
      });
    } catch (error) {
      console.error("Error checking room schedules:", error);
      return res.status(500).json({ message: "Internal server error", error });
    }
  },

  delete: async (req, res) => {
    try {
      const { code } = req.params;
      const schedule = await Schedule.findOne({ code: code });

      if (!schedule) {
        return res.status(404).json({ message: "schedule not found" });
      }

      const deleteSchedule = await Schedule.delete({ code: code });
      const deleteSeatStatus = await SeatStatusInSchedule.deleteMany({
        scheduleCode: code,
      });

      return res.status(200).json({
        message: "Schedule deleted successfully",
        dataSchedule: deleteSchedule,
        dataSeatStatus: deleteSeatStatus,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  getAllMovieWithSchedules: async (req, res) => {
    try {
      const {  status } = req.query;
      
  
            // Tìm tất cả các lịch chiếu từ ngày hiện tại trở đi
        
      let targetDate = new Date().setHours(0, 0, 0, 0);
      
      //type = 1 lấy phim chưa có lịch chiếu và sắp chiếu

      if (status === ('3'|| 3)) {

        const schedules = await Schedule.find({
          date: { $gte: targetDate },
          status: { $ne: 0 }, // Status khác 0
        })
        .populate({
          path: "movieCode",
          model: "Movie",
          foreignField: "code",
          populate: {
            path: "movieGenreCode",
            model: "MovieGenre",
            select: "code name -_id",
            foreignField: "code",
          },
        });
    
        if (schedules.length === 0) {
          return res.status(200).json([]);
        }
    
        // Nhóm các lịch chiếu theo phim
        const moviesMap = {};
    
        schedules.forEach((schedule) => {
          const movie = schedule.movieCode;
          if (!moviesMap[movie.code]) {
            // Nếu phim chưa tồn tại trong danh sách, thêm vào
            moviesMap[movie.code] = {
              code: movie.code,
              name: movie.name,
              image: movie.image,
              duration: movie.duration,
              ageRestriction: movie.ageRestriction,
              description: movie.description, // Thêm mô tả
              trailer: movie.trailer, // Thêm trailer
              director: movie.director, // Thêm đạo diễn
              cast: movie.cast, // Thêm dàn diễn viên
              country: movie.country, // Thêm quốc gia
              startDate: movie.startDate, // Thêm ngày bắt đầu
              endDate: movie.endDate, // Thêm ngày kết thúc
              genres: movie.movieGenreCode.map((genre) => genre.name).join(", "), // Thêm thể loại
            };
          }
        });
        // Lấy danh sách các mã phim từ lịch chiếu
        const scheduledMovieCodes = Object.keys(moviesMap);
  
        // Tìm tất cả các phim không có lịch chiếu
        const movies = await Movie.find({
          status: 1, 
          startDate: { $gt: targetDate },
          code: { $nin: scheduledMovieCodes } // Bỏ qua các phim đã có lịch chiếu
        }).populate({
          path: "movieGenreCode",
          model: "MovieGenre",
          select: "code name -_id",
          foreignField: "code",
        });
        const movieFull = movies.map(movie => ({
          code: movie.code,
          name: movie.name,
          image: movie.image,
          duration: movie.duration,
          ageRestriction: movie.ageRestriction,
          description: movie.description,
          trailer: movie.trailer,
          director: movie.director,
          cast: movie.cast,
          country: movie.country,
          startDate: movie.startDate,
          endDate: movie.endDate,
          genres: movie.movieGenreCode.map(genre => genre.name).join(", "), // Thêm thể loại
        }));
        
        return res.status(200).json(movieFull);
      }
      else{

      // Tìm tất cả các lịch chiếu từ ngày hiện tại trở đi  status = 1 là sắp chiếu, 2 là suất chiếu sớm hơn ngày phát hành

        const schedules = await Schedule.find({ 
          date: { $gte: targetDate },
          status: status 
        })
        .populate({
          path: "movieCode",
          model: "Movie",
          foreignField: "code",
          populate: {
            path: "movieGenreCode",
            model: "MovieGenre",
            select: "code name -_id",
            foreignField: "code",
          },
        });
    
        if (schedules.length === 0) {
          return res.status(200).json([]);
        }
    
        // Nhóm các lịch chiếu theo phim
        const moviesMap = {};
    
        schedules.forEach((schedule) => {
          const movie = schedule.movieCode;
          if (!moviesMap[movie.code]) {
            // Nếu phim chưa tồn tại trong danh sách, thêm vào
            moviesMap[movie.code] = {
              code: movie.code,
              name: movie.name,
              image: movie.image,
              duration: movie.duration,
              ageRestriction: movie.ageRestriction,
              description: movie.description, // Thêm mô tả
              trailer: movie.trailer, // Thêm trailer
              director: movie.director, // Thêm đạo diễn
              cast: movie.cast, // Thêm dàn diễn viên
              country: movie.country, // Thêm quốc gia
              startDate: movie.startDate, // Thêm ngày bắt đầu
              endDate: movie.endDate, // Thêm ngày kết thúc
              genres: movie.movieGenreCode.map((genre) => genre.name).join(", "), // Thêm thể loại
            };
          }
        });
  
        // Chuyển từ object sang mảng
        const movies = Object.values(moviesMap);
    
        return res.status(200).json(movies);

      }

    } catch (error) {
      console.error("Error getting movies with schedules:", error);
      return res.status(500).json({ message: "Internal server error", error });
    }
  },

  getSchedulesByDateAndMovie: async (req, res) => {
    try {
      const { movieCode, date } = req.query; // Lấy movieCode từ query
  
      console.log(new Date());
  
      // Lấy tất cả các lịch chiếu theo ngày và movieCode
      const schedules = await Schedule.find({
        date: date, // Tìm lịch chiếu theo ngày đã cho
        movieCode: movieCode,
        startTime: { $gt: new Date() }, 
        status: { $ne: 0 }, // Status khác 0
      })
        .populate({
          path: "roomCode", // Giả sử bạn đã thiết lập populate đúng
          select: "name cinemaCode", // Chọn các trường cần thiết
          model: "Room",
          foreignField: "code",
          populate: {
            path: "cinemaCode", // Populate thông tin rạp từ room
            select: "name", // Chọn trường name từ Cinema
            model: "Cinema",
            foreignField: "code",
          },
        })
        .populate({
          path: "screeningFormatCode", // Giả sử bạn đã thiết lập populate đúng
          select: "name", // Chọn trường name từ RoomType
          model: "RoomType",
          foreignField: "code",
        })
        .populate({
          path: "subtitleCode", // Populate thông tin phụ đề
          select: "name", // Chọn trường name từ Subtitle
          model: "Subtitle",
          foreignField: "code",
        })
        .populate({
          path: "audioCode", // Populate thông tin âm thanh
          select: "name", // Chọn trường name từ Audio
          model: "Audio",
          foreignField: "code",
        });
  
      if (schedules.length === 0) {
        return res.status(200).json([]); // Nếu không có lịch chiếu
      }

      const groupedSchedules = schedules.reduce((acc, schedule) => {
        const scheduleDate = schedule.date;
        const room = schedule.roomCode; // Lấy thông tin phòng từ populate
        const cinema = room.cinemaCode; // Lấy thông tin rạp từ room
  
        // Kiểm tra xem ngày đã tồn tại trong acc chưa
        if (!acc[scheduleDate]) {
          acc[scheduleDate] = {
            date: scheduleDate,
            cinemas: {}, // Khởi tạo một đối tượng rỗng cho các rạp
          };
        }
  
        // Kiểm tra xem rạp đã tồn tại trong cinemas chưa
        if (!acc[scheduleDate].cinemas[cinema.code]) {
          acc[scheduleDate].cinemas[cinema.code] = {
            name: cinema.name, // Tên rạp
            screeningFormats: {}, // Khởi tạo một đối tượng rỗng cho các định dạng suất chiếu
          };
        }
  
        // Tạo một key duy nhất cho sự kết hợp của screeningFormatCode, subtitleCode và audioCode
        const formatKey = `${schedule.screeningFormatCode.code}_${schedule.subtitleCode ? schedule.subtitleCode.code : 'none'}_${schedule.audioCode ? schedule.audioCode.code : 'none'}`;
  
        // Kiểm tra xem định dạng suất chiếu đã tồn tại chưa
        if (!acc[scheduleDate].cinemas[cinema.code].screeningFormats[formatKey]) {
          acc[scheduleDate].cinemas[cinema.code].screeningFormats[formatKey] = {
            name: schedule.screeningFormatCode.name, // Lấy tên định dạng suất chiếu
            code: schedule.screeningFormatCode.code, // Mã định dạng suất chiếu
            subtitle: schedule.subtitleCode ? schedule.subtitleCode.name : null, // Lấy tên phụ đề nếu có
            audio: schedule.audioCode ? schedule.audioCode.name : null, // Lấy tên âm thanh nếu có
            showtimes: [], // Khởi tạo một mảng rỗng cho các giờ chiếu
          };
        }
  
        // Thêm giờ chiếu vào danh sách showtimes cho định dạng suất chiếu
        acc[scheduleDate].cinemas[cinema.code].screeningFormats[formatKey].showtimes.push({
          startTime: schedule.startTime,
          endTime: schedule.endTime,
        });
  
        return acc;
      }, {});
  
      // Chuyển đổi object thành array
      const result = Object.values(groupedSchedules).map(schedule => ({
        date: schedule.date,
        cinemas: Object.values(schedule.cinemas).map(cinema => ({
          name: cinema.name,
          screeningFormats: Object.values(cinema.screeningFormats),
        })),
      }));
  
      return res.status(200).json(result);
    } catch (error) {
      console.error("Error getting schedules:", error);
      return res.status(500).json({ message: "Internal server error", error });
    }
  },
  
  

};
module.exports = scheduleController;
