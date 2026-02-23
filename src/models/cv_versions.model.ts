import {
    BelongsTo,
    Column,
    DataType,
    ForeignKey,
    Model,
    PrimaryKey,
    Table,
} from 'sequelize-typescript';
import { Cvs, Users } from '~/models';

@Table({ tableName: 'cv_versions', timestamps: true, underscored: true })
export class Cv_versions extends Model<Cv_versions> {
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
        allowNull: false,
    })
    cv_id?: string;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    version_no!: number;
    @Column({
        type: DataType.JSON,
        allowNull: false,
    })
    content!: Record<string, any>;
    @ForeignKey(() => Users)
    @Column({
        type: DataType.UUID,
        allowNull: false,
    })
    created_by!: string;
    @BelongsTo(() => Cvs) cv?: Cvs;
    @BelongsTo(() => Users) creator?: Users;
}
