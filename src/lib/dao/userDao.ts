import { Model, Schema, model } from "mongoose";
import { MongodbService } from "../services";
import { User } from "../models";

export class UserDao {
  private static schemaName: string = "user";
  private static userSchema: Schema<User>;
  public static userModel: Model<User>;

  private constructor() {}

  public static getSchemaName(): string {
    return UserDao.schemaName;
  }

  public static async initInstance() {
    await MongodbService.initInstance();

    if (!UserDao.userSchema) {
      UserDao.userSchema = new Schema(
        {
          id: { type: String, required: true, unique: true },
          username: { type: String, unique: true, index: "text" },
          firstname: { type: String, index: "text" },
          lastname: { type: String, index: "text" },
          key: { type: String, index: "text" },
        },
        {
          timestamps: true,
        }
      );
    }

    if (!UserDao.userModel) {
      UserDao.userModel = model(UserDao.schemaName, UserDao.userSchema);
    }
  }

  public static async findByTelegramId(id: number): Promise<User | null> {
    const document = await UserDao.userModel.findOne({ id }).exec();
    if (document) {
      return { ...document.toObject() } as User;
    }

    return null;
  }

  public static async findByUsernames(
    usernames: Array<string>
  ): Promise<Array<User>> {
    const $or = usernames?.map((username: string) => ({
      username: username?.replace("@", "").trim(),
    }));
    return UserDao.userModel.find({ $or }).exec();
  }

  public static async findByUsername(username: string): Promise<User | null> {
    const document = await UserDao.userModel
      .findOne({ username: { $regex: new RegExp(username, "i") } })
      .exec();
    if (document) {
      return { ...document.toObject() } as User;
    }

    return null;
  }

  public static async save(user: User): Promise<User | null> {
    if (!user?.id) {
      throw new Error("id is missing");
    }

    if (!user?.username) {
      throw new Error("username is missing");
    }

    try {
      await UserDao.userModel.updateOne({ id: user.id }, user, {
        upsert: true,
      });

      return UserDao.findByUsername(user?.username);
    } catch (error) {
      throw error;
    }
  }
}
