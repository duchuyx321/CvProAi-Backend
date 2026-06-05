import {
    Column,
    DataType,
    HasMany,
    HasOne,
    Model,
    PrimaryKey,
    Table,
} from 'sequelize-typescript';
import * as bcrypt from 'bcryptjs';

import {
    User_profile,
    Cvs,
    Ai_runs,
    Subscriptions,
    Orders,
    Usage_quotas,
    Auth_tokens,
    Cv_exports,
    Cv_versions,
} from '~/models';

export enum user_status {
    ACTIVE = 'ACTIVE',
    BANNED = 'BANNED',
    DELETED = 'DELETED',
}
export enum user_role {
    ADMIN = 'ADMIN',
    USER = 'USER',
}
export enum user_provider {
    LOCAL = 'LOCAL',
    GOOGLE = 'GOOGLE',
    FACEBOOK = 'FACEBOOK',
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
        type: DataType.STRING(255),
        allowNull: false,
    })
    email!: string;

    @Column({
        type: DataType.STRING(255),
        allowNull: false,
    })
    password_hash!: string;

    @Column({
        type: DataType.STRING(255),
        allowNull: true,
    })
    full_name?: string;

    @Column({
        type: DataType.ENUM(...Object.values(user_role)),
        allowNull: false,
        defaultValue: user_role.USER,
    })
    role!: user_role;

    @Column({
        type: DataType.ENUM(...Object.values(user_status)),
        allowNull: false,
        defaultValue: user_status.ACTIVE,
    })
    status!: user_status;

    @Column({
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    })
    email_verified!: boolean;

    @Column({
        type: DataType.ENUM(...Object.values(user_provider)),
        allowNull: false,
        defaultValue: user_provider.LOCAL,
    })
    provider!: user_provider;

    @Column({
        type: DataType.DATE,
        allowNull: true,
    })
    last_login_at?: Date;

    @HasOne(() => User_profile)
    declare user_profile?: User_profile;

    @HasMany(() => Cvs)
    declare cvs?: Cvs[];

    @HasMany(() => Ai_runs)
    declare ai_runs?: Ai_runs[];

    @HasMany(() => Subscriptions)
    declare subscriptions?: Subscriptions[];

    @HasMany(() => Orders)
    declare orders?: Orders[];

    @HasMany(() => Usage_quotas)
    declare usage_quotas?: Usage_quotas[];

    @HasMany(() => Auth_tokens)
    declare auth_tokens?: Auth_tokens[];

    @HasMany(() => Cv_exports, 'created_by')
    declare cv_exports?: Cv_exports[];

    @HasMany(() => Cv_versions, 'created_by')
    declare cv_versions?: Cv_versions[];

    // more
    comparePassword(password: string): boolean {
        const { password_hash } = this.get({ plain: true });
        return bcrypt.compareSync(password, password_hash);
    }
    getUserWithoutPassword() {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password_hash, ...rest } = this.get({ plain: true });
        return rest;
    }
}
