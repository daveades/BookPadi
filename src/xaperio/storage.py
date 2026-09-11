import os

import boto3
from botocore.exceptions import ClientError


def _client():
    return boto3.client(
        "s3",
        endpoint_url=os.environ["R2_ENDPOINT_URL"],
        aws_access_key_id=os.environ["R2_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["R2_SECRET_ACCESS_KEY"],
        region_name=os.environ.get("R2_REGION", "auto"),
    )


def put_object(key, data, content_type):
    _client().put_object(
        Bucket=os.environ["R2_BUCKET"],
        Key=key,
        Body=data,
        ContentType=content_type,
    )


def get_object(key, byte_range=None):
    arguments = {
        "Bucket": os.environ["R2_BUCKET"],
        "Key": key,
    }
    if byte_range:
        arguments["Range"] = byte_range
    try:
        return _client().get_object(**arguments)
    except ClientError as error:
        code = str(error.response.get("Error", {}).get("Code", ""))
        if code in {"404", "NoSuchKey", "NotFound"}:
            return None
        raise


def prefix_exists(prefix):
    response = _client().list_objects_v2(
        Bucket=os.environ["R2_BUCKET"],
        Prefix=prefix,
        MaxKeys=1,
    )
    return response.get("KeyCount", 0) > 0


def delete_objects(keys):
    if not keys:
        return
    response = _client().delete_objects(
        Bucket=os.environ["R2_BUCKET"],
        Delete={"Objects": [{"Key": key} for key in keys], "Quiet": True},
    )
    if response.get("Errors"):
        raise RuntimeError("R2 did not delete every book object")
