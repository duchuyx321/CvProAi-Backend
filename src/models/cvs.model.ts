import {
    BeforeUpdate,
    BeforeValidate,
    BelongsTo,
    Column,
    DataType,
    ForeignKey,
    HasMany,
    Model,
    PrimaryKey,
    Table,
} from 'sequelize-typescript';

import {
    Users,
    Cv_templates,
    Cv_exports,
    Cv_versions,
    Ai_runs,
} from '~/models';
import { Helper } from '~/utils/helpers';

export enum cv_status {
    DRAFT = 'DRAFT',
    PUBLISHED = 'PUBLISHED',
    ARCHIVED = 'ARCHIVED',
}

export enum cv_visibility {
    PRIVATE = 'PRIVATE',
    PUBLIC = 'PUBLIC',
    LINK = 'LINK',
}

@Table({ tableName: 'cvs', timestamps: true, underscored: true })
export class Cvs extends Model<Cvs> {
    @PrimaryKey
    @Column({
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4,
        allowNull: false,
    })
    declare id: string;

    @ForeignKey(() => Users)
    @Column({
        type: DataType.UUID,
        allowNull: false,
    })
    user_id!: string;

    @ForeignKey(() => Cv_templates)
    @Column({
        type: DataType.UUID,
        allowNull: true,
    })
    template_id?: string;

    @Column({
        type: DataType.STRING(255),
        allowNull: false,
    })
    title!: string;

    @Column({
        type: DataType.STRING(20),
        allowNull: false,
        defaultValue: 'vi',
    })
    language!: string;
    @Column({
        type: DataType.TEXT,
        allowNull: true,
    })
    preview_url?: string;
    @Column({
        type: DataType.ENUM(...Object.values(cv_status)),
        allowNull: false,
        defaultValue: cv_status.DRAFT,
    })
    status!: cv_status;

    @Column({
        type: DataType.ENUM(...Object.values(cv_visibility)),
        allowNull: false,
        defaultValue: cv_visibility.PRIVATE,
    })
    visibility!: cv_visibility;

    @Column({
        type: DataType.STRING(255),
        allowNull: true,
        unique: true,
    })
    slug?: string;

    @Column({
        type: DataType.JSONB,
        allowNull: true,
    })
    content?: Record<string, any>;
    @Column({
        type: DataType.JSONB,
        allowNull: true,
    })
    custom_config?: Record<string, any>;

    @BelongsTo(() => Users)
    user?: Users;

    @BelongsTo(() => Cv_templates)
    template?: Cv_templates;

    @HasMany(() => Cv_exports)
    cv_exports?: Cv_exports[];

    @HasMany(() => Cv_versions)
    cv_versions?: Cv_versions[];

    @HasMany(() => Ai_runs)
    ai_runs?: Ai_runs[];

    // add slug auto
    @BeforeValidate // gọi trước khi tạo
    static makeSlug(newPlans: Cvs) {
        const name = newPlans.dataValues.title;
        if (name) {
            const slug = Helper.makeSlugFromString(name);
            newPlans.setDataValue('slug', slug);
        }
    }
    // update
    @BeforeUpdate // gọi trước khi update
    static updateSlug(newPlans: Cvs) {
        if (newPlans.changed('title')) {
            const name = newPlans.dataValues.title;
            const slug = Helper.makeSlugFromString(name);
            newPlans.setDataValue('slug', slug);
        }
    }
}
