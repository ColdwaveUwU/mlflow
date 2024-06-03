from mlflow.entities._mlflow_object import _MlflowObject
from mlflow.protos.service_pb2 import CustomMetric as ProtoCustomMetric


class CustomMetric(_MlflowObject):
    """
    Data about custom metric.
    """

    def __init__(
        self,
        name,
        value,
        version,
    ):
        if name is None:
            raise Exception("name cannot be None")
        if value is None:
            raise Exception("value cannot be None")
        if version is None:
            raise Exception("version cannot be None")

        self._name = name
        self._value = value
        self._version = version

    @property
    def name(self):
        """String containing name."""
        return self._name

    @property
    def value(self):
        """Vlaue of the metric."""
        return self._value

    @property
    def version(self):
        """String containing version."""
        return self._version

    def to_proto(self):
        proto = ProtoCustomMetric()
        proto.name = self.name
        proto.value = self.value
        proto.version = self.version
        return proto

    @classmethod
    def from_proto(cls, proto):
        return cls(
            name=proto.name,
            value=proto.value,
            version=proto.version,
        )
