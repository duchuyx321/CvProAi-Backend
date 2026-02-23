import {
    BelongsTo,
    BelongsToMany,
    Column,
    DataType,
    HasMany,
    HasOne,
    Model,
    PrimaryKey,
    Table,
} from 'sequelize-typescript';

import { Roles, User_roles, User_profile, Cvs, Cv_versions } from '~/models';

export enum user_status {
    ACTIVE = 'ACTIVE',
    BANNED = 'BANNED',
    DELETED = 'DELETED',
}

@Table({ tableName: 'users', timestamps: true, underscored: true })
export class Users extends Model<Users> {
    @PrimaryKey
    @Column({
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4,
        allowNull: false,
    })
    declare id: string;

    @Column({
        type: DataType.STRING,
        unique: true,
        allowNull: false,
    })
    email!: string;

    @Column({
        type: DataType.STRING,
        allowNull: true,
    })
    password_hash!: string;

    @Column({
        type: DataType.STRING,
        allowNull: true,
    })
    fullName!: string;

    @Column({
        type: DataType.ENUM(...Object.values(user_status)),
        defaultValue: user_status.ACTIVE,
        allowNull: false,
    })
    status?: user_status;

    @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
    email_verified?: boolean;

    @Column({ type: DataType.DATE, allowNull: false })
    last_login_at?: Date;

    @BelongsToMany(() => Roles, () => User_roles)
    roles?: Roles;

    @HasOne(() => User_profile)
    user_profile?: User_profile;

    @BelongsTo(() => Cvs)
    cvs?: Cvs[];
    @HasMany(() => Cv_versions)
    cv_versions?: Cv_versions;
}
