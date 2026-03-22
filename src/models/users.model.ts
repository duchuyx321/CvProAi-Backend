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
    Cv_versions,
    Ai_runs,
    Subscriptions,
    Orders,
    Usage_quotas,
    Audit_logs,
    Auth_tokens,
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
        unique: true,
        allowNull: false,
    })
    email!: string;

    @Column({
        type: DataType.STRING(255),
        allowNull: false,
    })
    password_hash!: string;

    @Column({
        field: 'full_name',
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
        defaultValue: user_status.ACTIVE,
        allowNull: false,
    })
    status!: user_status;

    @Column({
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    })
    email_verified!: boolean;

    @Column({
        type: DataType.DATE,
        allowNull: true,
    })
    last_login_at?: Date;

    @HasOne(() => User_profile)
    user_profile?: User_profile;

    @HasMany(() => Cvs)
    cvs?: Cvs[];

    @HasMany(() => Cv_versions, 'created_by')
    cv_versions?: Cv_versions[];

    @HasMany(() => Ai_runs)
    ai_runs?: Ai_runs[];

    @HasMany(() => Subscriptions)
    subscriptions?: Subscriptions[];

    @HasMany(() => Orders)
    orders?: Orders[];

    @HasMany(() => Usage_quotas)
    usage_quotas?: Usage_quotas[];

    @HasMany(() => Audit_logs, 'actor_user_id')
    audit_logs?: Audit_logs[];

    @HasMany(() => Auth_tokens)
    auth_tokens?: Auth_tokens[];

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
