from django.db import models

# Create your models here.
from django.db import models
from products.models import Product
from warehouse.models import Location


class Receipt(models.Model):

    supplier = models.CharField(max_length=200)

    status = models.CharField(
        max_length=20,
        choices=(
            ("draft", "Draft"),
            ("done", "Done"),
        ),
        default="draft",
    )

    created_at = models.DateTimeField(auto_now_add=True)


class ReceiptItem(models.Model):

    receipt = models.ForeignKey(Receipt, on_delete=models.CASCADE)

    product = models.ForeignKey(Product, on_delete=models.CASCADE)

    quantity = models.IntegerField()