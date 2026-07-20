import boto3
import csv
import io
from datetime import datetime
from boto3.dynamodb.conditions import Key

s3 = boto3.client("s3")
dynamodb = boto3.resource("dynamodb")
asset_table = dynamodb.Table("AssetRegisterV2")

BUCKET_NAME = "allsaintsassetregister"
FILE_KEY = "AllWarrantyInfo.csv"


def convert_date(date_str):
    date_str = (date_str or "").strip()
    if not date_str:
        return None
    return datetime.strptime(date_str, "%d/%m/%Y").strftime("%Y-%m-%d")


def get_asset_items(serial_number):
    response = asset_table.query(
        IndexName="GSI-SerialNumber",
        KeyConditionExpression=Key("serialNumber").eq(serial_number) & Key("SK").begins_with("#"),
        ProjectionExpression="PK, SK",
    )
    return response.get("Items", [])


def update_asset(pk, sk, purchase_date, warranty_end_date, manufacturer):
    asset_table.update_item(
        Key={"PK": pk, "SK": sk},
        UpdateExpression="SET purchaseDate = :pd, warrantyEndDate = :we, manufacturer = :mf",
        ExpressionAttributeValues={
            ":pd": purchase_date,
            ":we": warranty_end_date,
            ":mf": manufacturer,
        },
    )


def lambda_handler(event, context):
    obj = s3.get_object(Bucket=BUCKET_NAME, Key=FILE_KEY)
    content = obj["Body"].read().decode("utf-8-sig")

    # Detect whether the file is comma or tab delimited
    sample = content[:2048]
    try:
        dialect = csv.Sniffer().sniff(sample, delimiters=",\t")
    except csv.Error:
        dialect = csv.excel

    reader = csv.DictReader(io.StringIO(content), dialect=dialect)
    reader.fieldnames = [name.strip() for name in reader.fieldnames]

    updated = 0
    not_found = []
    errors = []

    for row in reader:
        serial_number = (row.get("Serial number") or "").strip()
        if not serial_number:
            continue

        try:
            purchase_date = convert_date(row.get("Purchase date"))
            warranty_end_date = convert_date(row.get("Warranty end date"))
            manufacturer = (row.get("Manufacturer") or "").strip()

            items = get_asset_items(serial_number)

            if not items:
                not_found.append(serial_number)
                continue

            for item in items:
                update_asset(item["PK"], item["SK"], purchase_date, warranty_end_date, manufacturer)
                updated += 1

        except Exception as e:
            errors.append({"serial_number": serial_number, "error": str(e)})

    result = {
        "updated_count": updated,
        "not_found_count": len(not_found),
        "not_found_serials": not_found,
        "error_count": len(errors),
        "errors": errors,
    }

    print(result)
    return result
