import mongoose, { ConnectOptions } from "mongoose";

const { MONGO_USER, MONGO_PASSWORD, MONGO_HOST, MONGO_DATABASE } = process.env;

export class MongodbService {
  private static uri = `mongodb+srv://${MONGO_USER}:${MONGO_PASSWORD}@${MONGO_HOST}/${MONGO_DATABASE}?retryWrites=true&w=majority`;
  private static connection: typeof mongoose;
  private static config: ConnectOptions = {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  };

  private constructor() {}

  public static async initInstance(): Promise<void> {
    if (!this.connection) {
      this.connection = await mongoose.connect(this.uri, this.config);
    }
  }
}
