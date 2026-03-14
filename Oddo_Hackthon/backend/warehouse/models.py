from django.db import models
from products.models import Product


class Warehouse(models.Model):
    name = models.CharField(max_length=200)
    location = models.CharField(max_length=200)

    def __str__(self):
        return self.name


class Location(models.Model):

    warehouse = models.ForeignKey(
        Warehouse,
        on_delete=models.CASCADE,
        related_name="locations"
    )

    name = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.warehouse.name} - {self.name}"


class Stock(models.Model):

    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    location = models.ForeignKey(Location, on_delete=models.CASCADE)

    quantity = models.IntegerField(default=0)

    class Meta:
        unique_together = ("product", "location")