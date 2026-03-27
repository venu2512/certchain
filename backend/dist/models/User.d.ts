import mongoose, { Document } from "mongoose";
export type UserRole = "admin" | "organization" | "user";
export interface IUser extends Document {
    username: string;
    email: string;
    password: string;
    role: UserRole;
    organization?: string;
    organizationDetails?: {
        name: string;
        address: string;
        contact: string;
        website: string;
    };
    isActive: boolean;
    lastLogin?: Date;
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}
declare const User: mongoose.Model<IUser, {}, {}, {}, mongoose.Document<unknown, {}, IUser, {}, {}> & IUser & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default User;
//# sourceMappingURL=User.d.ts.map