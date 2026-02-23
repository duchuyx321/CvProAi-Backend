import {
    BelongsTo,
    Column,
    DataType,
    ForeignKey,
    Model,
    PrimaryKey,
    Table,
} from 'sequelize-typescript';
import { Cv_versions, Cvs, Users } from '~/models';

export enum export_format {
    PDF = 'PDF',
    DOCX = 'DOCX',
    JSON = 'JSON',
}
@Table({ tableName: 'cv_exports', timestamps: true, underscored: true })
export class Cv_exports extends Model<Cv_exports> {
    @PrimaryKey
    @Column({
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4,
        allowNull: false,
    })
    declare id: string;
    @ForeignKey(() => Cvs)
    @Column({
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4,
        allowNull: false,
    })
    cv_id!: string;
    @ForeignKey(() => Cv_versions)
    @Column({
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4,
        allowNull: false,
    })
    version_id!: string;
    @Column({
        type: DataType.ENUM(...Object.values(export_format)),
        defaultValue: export_format.PDF,
        allowNull: false,
    })
    format!: string;
    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    file_url!: string;

    @Column(DataType.STRING(128))
    file_hash?: string;

    @ForeignKey(() => Users)
    @Column(DataType.UUID)
    created_by?: string;

    @BelongsTo(() => Cvs) cv?: Cvs;
    @BelongsTo(() => Cv_versions) cv_versions?: Cv_versions;
    @BelongsTo(() => Users) creator?: Users;
}
