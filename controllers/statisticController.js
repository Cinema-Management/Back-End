const SalesInvoice = require("../models/SalesInvoice");
const SalesInvoiceDetail = require("../models/SalesInvoiceDetail");
const PromotionResult = require("../models/PromotionResult");
const HierarchyValue = require("../models/HierarchyValue");
const ReturnInvoice = require("../models/ReturnInvoice");
const ReturnInvoiceDetail = require("../models/ReturnInvoiceDetail");
const Product = require("../models/Product");
const statisticController = {
  getStatisticsByStaff: async (req, res) => {
    try {
      const queryParams = [req.query.fromDate, req.query.toDate];
      const validQueryCount = queryParams.filter((param) => param).length;

      if (validQueryCount < 2) {
        return res.status(200).json([]);
      }
      const pageSize = 10;
      const page = parseInt(req.query.page) || 1;
      const skip = (page - 1) * pageSize;

      const filter = {};

      if (req.query.staffCode) {
        filter.staffCode = req.query.staffCode;
      }
      filter.status = 1;

      if (req.query.fromDate && req.query.toDate) {
        const startDate = new Date(req.query.fromDate);
        const endDate = new Date(req.query.toDate);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);

        filter.createdAt = {
          $gte: startDate,
          $lte: endDate,
        };
      }

      let invoices = await SalesInvoice.find(filter)
        .sort({ createdAt: 1 })
        .populate({
          path: "scheduleCode",
          select: "roomCode movieCode",
          foreignField: "code",
          populate: [
            {
              path: "roomCode",
              select: "cinemaCode name",
              foreignField: "code",
              populate: {
                path: "cinemaCode",
                select: "name",
                foreignField: "code",
              },
            },
          ],
        })
        .populate({
          path: "staffCode",
          select: "name phone",
          foreignField: "code",
        })
        .lean();

      if (req.query.cinemaCode) {
        invoices = invoices.filter((invoice) => {
          const cinemaCode = invoice.scheduleCode.roomCode.cinemaCode.code;
          return cinemaCode && cinemaCode === req.query.cinemaCode;
        });
      }

      const groupedByStaff = {};
      const invoiceCodes = invoices.map((invoice) => invoice.code);

      const [details, promotionResults] = await Promise.all([
        SalesInvoiceDetail.find({ salesInvoiceCode: { $in: invoiceCodes } })
          .select(
            "salesInvoiceCode productCode priceDetailCode quantity totalAmount"
          )
          .lean(),
        PromotionResult.find({ salesInvoiceCode: { $in: invoiceCodes } })
          .select("salesInvoiceCode discountAmount")
          .lean(),
      ]);

      const invoiceDetailsMap = details.reduce((map, detail) => {
        if (!map[detail.salesInvoiceCode]) map[detail.salesInvoiceCode] = [];
        map[detail.salesInvoiceCode].push(detail);
        return map;
      }, {});

      const promotionResultsMap = promotionResults.reduce((map, promotion) => {
        map[promotion.salesInvoiceCode] = promotion.discountAmount;
        return map;
      }, {});

      invoices.forEach((invoice) => {
        const staffCode = invoice.staffCode?.code;
        if (staffCode) {
          if (!groupedByStaff[staffCode]) {
            groupedByStaff[staffCode] = {
              staff: invoice.staffCode,
              invoicesByDate: {}, // Group invoices by date within each staff
              totalAmount: 0,
              totalDiscountAmount: 0,
              total: 0,
            };
          }

          const invoiceDetails = invoiceDetailsMap[invoice.code] || [];
          const promotionResult = promotionResultsMap[invoice.code] || 0;

          const totalAmount = invoiceDetails.reduce(
            (sum, detail) => sum + detail.totalAmount,
            0
          );
          const total = totalAmount - promotionResult;

          const invoiceDate = getFormattedDay(invoice.createdAt);

          if (!groupedByStaff[staffCode].invoicesByDate[invoiceDate]) {
            groupedByStaff[staffCode].invoicesByDate[invoiceDate] = {
              date: invoiceDate,
              invoices: [],
              totalAmount: 0,
              totalDiscountAmount: 0,
              total: 0,
            };
          }

          groupedByStaff[staffCode].invoicesByDate[invoiceDate].invoices.push({
            invoice,
            discountAmount: promotionResult,
            totalAmount,
            total,
          });

          groupedByStaff[staffCode].invoicesByDate[invoiceDate].totalAmount +=
            totalAmount;
          groupedByStaff[staffCode].invoicesByDate[
            invoiceDate
          ].totalDiscountAmount += promotionResult;
          groupedByStaff[staffCode].invoicesByDate[invoiceDate].total += total;

          groupedByStaff[staffCode].totalAmount += totalAmount;
          groupedByStaff[staffCode].totalDiscountAmount += promotionResult;
          groupedByStaff[staffCode].total += total;
        }
      });

      // Flatten the grouped results to calculate pagination based on grouped entries by date
      const allGroupedEntries = [];
      Object.values(groupedByStaff).forEach((staffData) => {
        Object.values(staffData.invoicesByDate).forEach((dateData) => {
          allGroupedEntries.push({
            ...dateData,
            staff: staffData.staff,
          });
        });
      });

      const totalGroupedEntries = allGroupedEntries.length;
      const totalPages = Math.ceil(totalGroupedEntries / pageSize);

      // Paginate the grouped entries
      const paginatedEntries =
        req.query.isExportAllData === "true"
          ? allGroupedEntries
          : allGroupedEntries.slice(skip, skip + pageSize);

      // Prepare the final grouped result
      const groupedResult = {};
      paginatedEntries.forEach((entry) => {
        const staffCode = entry.staff.code;
        if (!groupedResult[staffCode]) {
          groupedResult[staffCode] = {
            staff: entry.staff,
            invoicesByDate: {},
            totalAmount: 0,
            totalDiscountAmount: 0,
            total: 0,
          };
        }

        const invoiceDate = entry.date;

        if (!groupedResult[staffCode].invoicesByDate[invoiceDate]) {
          groupedResult[staffCode].invoicesByDate[invoiceDate] = {
            date: invoiceDate,
            invoices: [],
            totalAmount: 0,
            totalDiscountAmount: 0,
            total: 0,
          };
        }

        groupedResult[staffCode].invoicesByDate[invoiceDate].invoices.push(
          ...entry.invoices
        );
        groupedResult[staffCode].invoicesByDate[invoiceDate].totalAmount +=
          entry.totalAmount;
        groupedResult[staffCode].invoicesByDate[
          invoiceDate
        ].totalDiscountAmount += entry.totalDiscountAmount;
        groupedResult[staffCode].invoicesByDate[invoiceDate].total +=
          entry.total;

        groupedResult[staffCode].totalAmount += entry.totalAmount;
        groupedResult[staffCode].totalDiscountAmount +=
          entry.totalDiscountAmount;
        groupedResult[staffCode].total += entry.total;
      });

      const totalAmountAllStaff = Object.values(groupedByStaff).reduce(
        (sum, staffData) => sum + staffData.totalAmount,
        0
      );
      const totalDiscountAmountAllStaff = Object.values(groupedByStaff).reduce(
        (sum, staffData) => sum + staffData.totalDiscountAmount,
        0
      );
      const totalAllStaff = Object.values(groupedByStaff).reduce(
        (sum, staffData) => sum + staffData.total,
        0
      );

      const result = Object.values(groupedResult).map((staffData) => ({
        ...staffData,
        invoicesByDate: Object.values(staffData.invoicesByDate),
      }));

      res.status(200).json({
        items: result,
        totalPages: totalPages,
        currentPage: page,
        totalAmountByStaff: Object.values(groupedByStaff).map((staffData) => ({
          staff: staffData.staff,
          totalAmount: staffData.totalAmount,
          totalDiscountAmount: staffData.totalDiscountAmount,
          total: staffData.total,
        })),
        totalAmountAllStaff,
        totalDiscountAmountAllStaff,
        totalAllStaff,
      });
    } catch (error) {
      res.status(500).json({ message: "Lỗi máy chủ", error: error.message });
    }
  },
  getStatisticsByCustomer: async (req, res) => {
    try {
      const queryParams = [req.query.fromDate, req.query.toDate];
      const validQueryCount = queryParams.filter((param) => param).length;

      if (validQueryCount < 2) {
        return res.status(200).json([]);
      }

      const pageSize = 7;
      const page = parseInt(req.query.page) || 1;
      const skip = (page - 1) * pageSize;
      // Khởi tạo filter
      const filter = {};
      if (req.query.customerCode) {
        filter.customerCode = req.query.customerCode;
      }
      filter.status = 1;

      if (req.query.fromDate && req.query.toDate) {
        const startDate = new Date(req.query.fromDate).setHours(0, 0, 0, 0);
        const endDate = new Date(req.query.toDate).setHours(23, 59, 59, 999);
        filter.createdAt = { $gte: startDate, $lte: endDate };
      }
      let invoices = await SalesInvoice.find(filter)
        .sort({ createdAt: -1 })
        .populate({
          path: "scheduleCode",
          select: "roomCode movieCode",
          foreignField: "code",
          populate: [
            {
              path: "roomCode",
              select: "cinemaCode name",
              populate: {
                path: "cinemaCode",
                select: "name",
                foreignField: "code",
              },
              foreignField: "code",
            },
          ],
        })
        .populate({
          path: "customerCode",
          select: "name phone address",
          foreignField: "code",
        })
        .lean();
      if (req.query.cinemaCode) {
        invoices = invoices.filter(
          (invoice) =>
            invoice.scheduleCode?.roomCode?.cinemaCode?.code ===
            req.query.cinemaCode
        );
      }
      const invoiceCodes = invoices.map((invoice) => invoice.code);
      const [details, promotionResults] = await Promise.all([
        SalesInvoiceDetail.find({ salesInvoiceCode: { $in: invoiceCodes } })
          .select(
            "salesInvoiceCode productCode productType priceDetailCode quantity totalAmount"
          )
          .populate({
            path: "productCode",
            select: "name type",
            foreignField: "code",
          })
          .lean(),
        PromotionResult.find({ salesInvoiceCode: { $in: invoiceCodes } })
          .select("salesInvoiceCode discountAmount")
          .lean(),
      ]);

      const invoiceDetailsMap = details.reduce((map, detail) => {
        if (!map[detail.salesInvoiceCode]) map[detail.salesInvoiceCode] = [];
        map[detail.salesInvoiceCode].push(detail);
        return map;
      }, {});

      const promotionResultsMap = promotionResults.reduce((map, promotion) => {
        map[promotion.salesInvoiceCode] = promotion.discountAmount;
        return map;
      }, {});

      const groupedByCustomer = invoices.reduce((grouped, invoice) => {
        const customerCode = invoice.customerCode?.code;
        if (customerCode) {
          if (!grouped[customerCode]) {
            grouped[customerCode] = {
              customer: invoice.customerCode,
              totalAmount: 0,
              totalDiscountAmount: 0,
              total: 0,
              totalsByType: {},
            };
          }

          const invoiceDetails = invoiceDetailsMap[invoice.code] || [];
          const promotionResult = promotionResultsMap[invoice.code] || 0;

          const groupedByProductType = invoiceDetails.reduce(
            (group, detail) => {
              let type = detail.productCode.type;
              if (type === 1 || type === 2) type = 1;

              if (!group[type]) group[type] = [];
              group[type].push(detail);
              return group;
            },
            {}
          );
          Object.keys(groupedByProductType).forEach((type) => {
            const typeDetails = groupedByProductType[type];
            const totalAmount = typeDetails.reduce(
              (sum, detail) => sum + detail.totalAmount,
              0
            );
            const discountAmount = Math.round(
              promotionResult *
                (totalAmount /
                  invoiceDetails.reduce(
                    (sum, detail) => sum + detail.totalAmount,
                    0
                  ))
            );
            const totalAfterDiscount = totalAmount - discountAmount;

            if (!grouped[customerCode].totalsByType[type]) {
              grouped[customerCode].totalsByType[type] = {
                totalAmount: 0,
                discountAmount: 0,
                totalAfterDiscount: 0,
              };
            }

            grouped[customerCode].totalsByType[type].totalAmount += totalAmount;
            grouped[customerCode].totalsByType[type].discountAmount +=
              discountAmount;
            grouped[customerCode].totalsByType[type].totalAfterDiscount +=
              totalAfterDiscount;
          });

          const totalAmount = invoiceDetails.reduce(
            (sum, detail) => sum + detail.totalAmount,
            0
          );
          grouped[customerCode].totalAmount += totalAmount;
          grouped[customerCode].totalDiscountAmount += promotionResult;
          grouped[customerCode].total += totalAmount - promotionResult;
        }
        return grouped;
      }, {});

      const totalPages = Math.ceil(
        Object.keys(groupedByCustomer).length / pageSize
      );
      const customersPage =
        req.query.isExportAllData === "true"
          ? Object.values(groupedByCustomer) // Export all data
          : Object.values(groupedByCustomer).slice(skip, skip + pageSize); // Paginate data

      const finalResult = await Promise.all(
        customersPage.map(async (customerData) => {
          const fullAddress = await buildFullAddress(
            customerData.customer.address
          );
          const [addressDetail = "", ward = "", district = "", province = ""] =
            fullAddress;
          return {
            ...customerData,
            customer: {
              ...customerData.customer,
              address: fullAddress.join(", "),
              addressDetail,
              ward,
              district,
              province,
            },
          };
        })
      );

      res.status(200).json({
        items: finalResult,
        totalPages: totalPages,
        currentPage: page,
      });
    } catch (error) {
      res.status(500).json({ message: "Lỗi máy chủ", error: error.message });
    }
  },
  getReturnInvoiceDetailsByCinemaCode: async (req, res) => {
    try {
      const queryParams = [req.query.fromDate, req.query.toDate];
      const validQueryCount = queryParams.filter((param) => param).length;

      if (validQueryCount < 2) {
        return res.status(200).json([]);
      }
      const pageSize = 10;
      const page = parseInt(req.query.page) || 1;
      const skip = (page - 1) * pageSize;

      const filter = {};
      if (req.query.fromDate && req.query.toDate) {
        const startDate = new Date(req.query.fromDate);
        const endDate = new Date(req.query.toDate);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);

        filter.createdAt = {
          $gte: startDate,
          $lte: endDate,
        };
      }

      let invoices = await ReturnInvoice.find(filter)
        .sort({ createdAt: 1 })
        .populate({
          path: "scheduleCode",
          select: "roomCode movieCode",
          foreignField: "code",
          populate: {
            path: "roomCode",
            select: "cinemaCode name",
            foreignField: "code",
            populate: {
              path: "cinemaCode",
              select: "name",
              foreignField: "code",
            },
          },
        })
        .lean();

      if (req.query.cinemaCode) {
        invoices = invoices.filter((invoice) => {
          const cinemaCode = invoice.scheduleCode.roomCode.cinemaCode.code;
          return cinemaCode && cinemaCode === req.query.cinemaCode;
        });
      }

      const returnInvoiceCodes = invoices.map((invoice) => invoice.code);
      const invoiceDetails = await ReturnInvoiceDetail.find({
        returnInvoiceCode: { $in: returnInvoiceCodes },
      }).lean();

      let totalQuantity = 0;
      let totalAmount = 0;
      invoiceDetails.forEach((detail) => {
        totalQuantity += detail.quantity;
        totalAmount += detail.totalAmount;
      });
      const totalInvoiceDetails = invoiceDetails.length;
      const totalPages = Math.ceil(totalInvoiceDetails / pageSize);
      const paginatedInvoiceDetails =
        req.query.isExportAllData === "true"
          ? invoiceDetails
          : invoiceDetails.slice(skip, skip + pageSize);

      const populatedInvoiceDetails = await Promise.all(
        paginatedInvoiceDetails.map(async (detail) => {
          const returnInvoice = await ReturnInvoice.findOne({
            code: detail.returnInvoiceCode,
          }).select("code createdAt salesInvoiceCode");

          const salesInvoice = await SalesInvoice.findOne({
            code: returnInvoice.salesInvoiceCode,
          }).select("code createdAt");

          const product = await Product.findOne({
            code: detail.productCode,
          }).select("code name type seatNumber");

          return {
            code: detail.code,
            salesInvoiceCode: salesInvoice.code,
            salesInvoiceCreatedAt: salesInvoice.createdAt,
            returnInvoiceCode: returnInvoice.code,
            returnInvoiceCreatedAt: returnInvoice.createdAt,
            productType: product.type,
            productCode: product.code,
            productName: product.name,
            seatNumber: product.seatNumber,
            productQuantity: detail.quantity,
            totalAmount: detail.totalAmount,
          };
        })
      );

      res.status(200).json({
        data: populatedInvoiceDetails,
        totalQuantity,
        totalAmount,
        totalPages,
        currentPage: page,
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  },
  getPromotionResult: async (req, res) => {
    try {
      const pageSize = 8;
      const page = parseInt(req.query.page) || 1;
      const skip = (page - 1) * pageSize;
      const filter = { status: 1 };

      let promotionResults = await PromotionResult.find(filter)
        .populate({
          path: "promotionDetailCode",
          select: "code promotionLineCode",
          foreignField: "code",
          populate: {
            path: "promotionLineCode",
            model: "PromotionLine",
            select: "code promotionCode",
            foreignField: "code",
            populate: {
              path: "promotionCode",
              model: "Promotion",
              select: "code description startDate endDate",
              foreignField: "code",
            },
          },
        })
        .populate({
          path: "freeProductCode",
          model: "Product",
          select: "code name",
          foreignField: "code",
        })
        .populate({
          path: "salesInvoiceCode",
          model: "SalesInvoice",
          select: "code schedulesCode",
          foreignField: "code",
          populate: {
            path: "scheduleCode",
            model: "Schedule",
            select: "code roomCode",
            foreignField: "code",
            populate: {
              path: "roomCode",
              model: "Room",
              select: "code cinemaCode",
              foreignField: "code",
            },
          },
        });

      if (req.query.promotionCode) {
        promotionResults = promotionResults.filter((result) => {
          const promotionDetail = result.promotionDetailCode;
          const promotionLine = promotionDetail?.promotionLineCode;
          const promotionCode = promotionLine?.promotionCode;
          return (
            promotionCode && promotionCode.code === req.query.promotionCode
          );
        });
      } else if (req.query.fromDate && req.query.toDate) {
        const startDate = new Date(req.query.fromDate);
        const endDate = new Date(req.query.toDate);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);

        promotionResults = promotionResults.filter((result) => {
          const promotionDetail = result.promotionDetailCode;
          const promotionLine = promotionDetail?.promotionLineCode;
          const promotionCode = promotionLine?.promotionCode;

          if (promotionCode && promotionCode.startDate) {
            const promotionStartDate = new Date(promotionCode.startDate);
            promotionStartDate.setHours(0, 0, 0, 0);
            return (
              promotionStartDate >= startDate && promotionStartDate <= endDate
            );
          }
          return false;
        });
      }
      const groupedResults = promotionResults.reduce(
        (acc, result) => {
          const promotionDetail = result.promotionDetailCode;
          const promotion = promotionDetail.promotionLineCode.promotionCode;
          const promotionKey = promotion.code;

          if (!acc.promotions[promotionKey]) {
            acc.promotions[promotionKey] = {
              promotionCode: promotion.code,
              description: promotion.description,
              startDate: promotion.startDate,
              endDate: promotion.endDate,
              totalDiscountAmount: 0,
              totalQuantity: 0,
              totalProductGifts: {},
            };
          }

          if (result.discountAmount) {
            acc.promotions[promotionKey].totalDiscountAmount +=
              result.discountAmount;
            acc.overallTotalDiscountAmount += result.discountAmount;
          }

          if (result.freeProductCode) {
            const productCode = result.freeProductCode.code;
            const productName = result.freeProductCode.name;
            const quantity = result.freeQuantity || 0;

            if (!acc.promotions[promotionKey].totalProductGifts[productCode]) {
              acc.promotions[promotionKey].totalProductGifts[productCode] = {
                productCode,
                productName,
                totalQuantity: 0,
              };
            }

            acc.promotions[promotionKey].totalProductGifts[
              productCode
            ].totalQuantity += quantity;
            acc.promotions[promotionKey].totalQuantity += quantity;
            acc.overallTotalQuantity += quantity;
          }

          return acc;
        },
        {
          promotions: {},
          overallTotalDiscountAmount: 0,
          overallTotalQuantity: 0,
        }
      );

      // Chuyển đổi groupedResults thành định dạng mong muốn và phân trang
      const mappedPromotions = Object.values(groupedResults.promotions).map(
        (promo) => {
          const products = Object.values(promo.totalProductGifts).map(
            (product) => ({
              productCode: product.productCode,
              productName: product.productName,
              totalQuantity: product.totalQuantity,
            })
          );

          products.push({ totalDiscountAmount: promo.totalDiscountAmount });

          return {
            promotionCode: promo.promotionCode,
            description: promo.description,
            startDate: promo.startDate,
            endDate: promo.endDate,
            totalDiscountAmount: promo.totalDiscountAmount,
            totalQuantity: promo.totalQuantity,
            products,
          };
        }
      );

      const totalPromotions = mappedPromotions.length;
      const totalPages = Math.ceil(totalPromotions / pageSize);
      const paginatedPromotions =
        req.query.isExportAllData === "true"
          ? mappedPromotions
          : mappedPromotions.slice(skip, skip + pageSize);

      return res.status(200).send({
        promotions: paginatedPromotions,
        overallTotalDiscountAmount: groupedResults.overallTotalDiscountAmount,
        overallTotalQuantity: groupedResults.overallTotalQuantity,
        page,
        totalPages,
      });
    } catch (error) {
      return res.status(500).send({ message: error.message });
    }
  },

  getTotalByMovie: async (req, res) => {
    try {
      const pageSize = 15;
      const page = parseInt(req.query.page) || 1;
      const skip = (page - 1) * pageSize;
      let salesInvoiceDetails = await SalesInvoiceDetail.find()
        .populate({
          path: "salesInvoiceCode",
          select: "code status scheduleCode",
          match: { status: 1 },
          foreignField: "code",
          populate: {
            path: "scheduleCode",
            select: "code movieCode roomCode",
            foreignField: "code",
            populate: [
              {
                path: "movieCode",
                select: "code name",
                foreignField: "code",
              },
              {
                path: "roomCode",
                select: "cinemaCode name",
                foreignField: "code",
                populate: {
                  path: "cinemaCode",
                  select: "code name",
                  foreignField: "code",
                },
              },
            ],
          },
        })
        .populate({
          path: "productCode",
          model: "Product",
          select: "code name type",
          match: { type: 0 },
          foreignField: "code",
        })
        .lean();
      if (req.query.movieCode) {
        salesInvoiceDetails = salesInvoiceDetails.filter((detail) => {
          const movieCode =
            detail.salesInvoiceCode?.scheduleCode?.movieCode?.code;
          return movieCode && movieCode === req.query.movieCode;
        });
      }

      if (req.query.cinemaCode) {
        salesInvoiceDetails = salesInvoiceDetails.filter((detail) => {
          const cinemaCode =
            detail.salesInvoiceCode?.scheduleCode?.roomCode?.cinemaCode?.code;
          return cinemaCode && cinemaCode === req.query.cinemaCode;
        });
      }

      const filteredDetails = salesInvoiceDetails.filter(
        (detail) => detail.salesInvoiceCode && detail.productCode
      );

      const totalByMovie = filteredDetails.reduce((acc, detail) => {
        const movieCode = detail.salesInvoiceCode.scheduleCode.movieCode.code;
        const totalAmount = detail.totalAmount;
        const quantity = detail.quantity;

        if (!acc[movieCode]) {
          acc[movieCode] = {
            movieCode,
            movieName: detail.salesInvoiceCode.scheduleCode.movieCode.name,
            totalRevenue: 0,
            totalQuantity: 0,
          };
        }

        acc[movieCode].totalRevenue += totalAmount;
        acc[movieCode].totalQuantity += quantity;

        return acc;
      }, {});

      const result = Object.values(totalByMovie).sort(
        (a, b) => b.totalRevenue - a.totalRevenue
      );

      const paginatedResult =
        req.query.isExportAllData === "true"
          ? result
          : result.slice(skip, skip + pageSize);

      const totalPages = Math.ceil(result.length / pageSize);

      return res.status(200).send({
        data: paginatedResult,
        totalPages: totalPages,
        currentPage: page,
        totalResults: result.length,
      });
    } catch (error) {
      return res.status(500).send({ message: error.message });
    }
  },
};
const buildFullAddress = async (currentCode, addressParts = []) => {
  const hierarchy = await HierarchyValue.findOne({ code: currentCode });

  if (!hierarchy) {
    return addressParts;
  }
  addressParts.push(hierarchy.name);
  if (hierarchy.parentCode) {
    return await buildFullAddress(hierarchy.parentCode, addressParts);
  }
  return addressParts;
};
function getFormattedDay(isoString) {
  const date = new Date(isoString);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${day}/${month}/${year}`;
}

module.exports = statisticController;
