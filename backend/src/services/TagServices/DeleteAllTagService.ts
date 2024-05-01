import Tag from "../../models/Tag";
import AppError from "../../errors/AppError";

const DeleteAllTagService = async (companyId: number): Promise<void> => {
  await Tag.findAll();

  if (!Tag) {
    throw new AppError("ERR_NO_TAG_FOUND", 404);
  }

  await Tag.destroy({where: {
    companyId: companyId
  } })
};

export default DeleteAllTagService;