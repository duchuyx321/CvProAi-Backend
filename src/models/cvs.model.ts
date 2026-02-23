import {
    BelongsTo,
    Column,
    DataType,
    ForeignKey,
    HasMany,
    Model,
    PrimaryKey,
    Table,
} from 'sequelize-typescript';
import { Users, Cv_templates, Cv_versions } from '~/models';

export enum cvs_status {
    DRAFT = ' DRAFT',
    PUBLISHED = 'PUBLISHED',
    ARCHIVED = 'ARCHIVED',
}
export enum cvs_visibility {
    PRIVATE = 'PRIVATE',
    PUBLIC = 'PUBLIC',
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
    @Column({ type: DataType.UUID, allowNull: false })
    user_id!: string;
    @ForeignKey(() => Cv_templates)
    @Column({ type: DataType.UUID, allowNull: false })
    template_id!: string;
    @Column({ type: DataType.STRING, allowNull: false })
    title!: string;
    @Column({ type: DataType.STRING, defaultValue: 'vi', allowNull: false })
    language?: string;
    @Column({ type: DataType.STRING, defaultValue: 'vi', allowNull: false })
    status?: string;
    @Column({ type: DataType.STRING, unique: true, allowNull: false })
    slug?: string;
    @Column({ type: DataType.JSON, allowNull: true })
    meta?: string; // custom setting

    @BelongsTo(() => Users)
    users?: Users;
    @BelongsTo(() => Cv_templates)
    cv_templates?: Cv_templates;

    @HasMany(() => Cv_versions)
    cv_versions?: Cv_versions;
}
